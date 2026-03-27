import { useEffect, useMemo, useRef, useState } from "react";
import { clubOptions } from "../../data/defaultData";
import type { ClubName, DistanceUnit, TrainingSession } from "../../types/app";
import { createId, todayIsoDate } from "../../utils/helpers";
import {
  displayDistanceToYards,
  distanceUnitLabel,
  formatDistanceFromYards,
  yardsToDisplayDistance,
} from "../../utils/units";

type TrainingCameraProps = {
  distanceUnit: DistanceUnit;
  sessions: TrainingSession[];
  onAddSession: (session: TrainingSession) => void;
  onDeleteSession: (id: string) => void;
};

const CLUB_SMASH_FACTOR: Partial<Record<ClubName, number>> = {
  Driver: 1.48,
  "3W": 1.46,
  "5W": 1.44,
  "3H": 1.42,
  "4H": 1.41,
  "5H": 1.4,
  "4I": 1.39,
  "5I": 1.38,
  "6I": 1.36,
  "7I": 1.34,
  "8I": 1.32,
  "9I": 1.3,
  PW: 1.28,
  "50W": 1.24,
  "52W": 1.23,
  "54W": 1.22,
  "56W": 1.21,
  "58W": 1.2,
  "60W": 1.18,
  GW: 1.23,
  SW: 1.21,
  LW: 1.18,
};

const CLUB_TRAVEL_METERS_DEFAULT: Partial<Record<ClubName, number>> = {
  Driver: 2.7,
  "3W": 2.55,
  "5W": 2.45,
  "3H": 2.35,
  "4H": 2.3,
  "5H": 2.25,
  "4I": 2.2,
  "5I": 2.15,
  "6I": 2.1,
  "7I": 2.05,
  "8I": 1.95,
  "9I": 1.85,
  PW: 1.75,
  "50W": 1.7,
  "52W": 1.68,
  "54W": 1.66,
  "56W": 1.62,
  "58W": 1.58,
  "60W": 1.55,
  GW: 1.66,
  SW: 1.62,
  LW: 1.55,
};

const CLUB_LAUNCH_ANGLE_DEFAULT: Partial<Record<ClubName, number>> = {
  Driver: 11,
  "3W": 12,
  "5W": 13,
  "3H": 14,
  "4H": 15,
  "5H": 16,
  "4I": 16,
  "5I": 17,
  "6I": 18,
  "7I": 19,
  "8I": 21,
  "9I": 23,
  PW: 27,
  "50W": 31,
  "52W": 33,
  "54W": 35,
  "56W": 37,
  "58W": 39,
  "60W": 41,
  GW: 33,
  SW: 37,
  LW: 41,
};

type SwingDetection = {
  durationMs: number;
  confidence: number;
};

function detectSwingFromMotion(
  samples: Array<{ t: number; score: number }>,
): SwingDetection | null {
  if (samples.length < 12) return null;

  const scores = samples.map((sample) => sample.score);
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const peak = Math.max(...scores);
  const dynamic = peak - median;

  if (dynamic < 1.6) return null;

  const peakIndex = scores.findIndex((score) => score === peak);
  if (peakIndex < 0) return null;

  const highThreshold = median + dynamic * 0.7;
  let fastStart = peakIndex;
  let fastEnd = peakIndex;

  while (fastStart > 0 && scores[fastStart - 1] >= highThreshold) {
    fastStart -= 1;
  }
  while (fastEnd < scores.length - 1 && scores[fastEnd + 1] >= highThreshold) {
    fastEnd += 1;
  }

  const rawDuration = samples[fastEnd].t - samples[fastStart].t;
  const durationMs = Math.min(450, Math.max(45, rawDuration));
  const dynamicRatio = dynamic / Math.max(0.5, median + 0.5);
  const confidence = Math.min(0.98, Math.max(0.2, dynamicRatio / 8));

  return { durationMs, confidence };
}

function estimateCarryMeters(ballSpeedMps: number, launchAngleDeg: number) {
  const g = 9.81;
  const angle = (launchAngleDeg * Math.PI) / 180;
  // Projectile baseline with coarse aerodynamic penalty for realistic golf carry estimation.
  const noDragRange = (ballSpeedMps ** 2 * Math.sin(2 * angle)) / g;
  const aerodynamicPenalty = 0.72;
  return Math.max(0, noDragRange * aerodynamicPenalty);
}

export function TrainingCamera({
  distanceUnit,
  sessions,
  onAddSession,
  onDeleteSession,
}: TrainingCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [club, setClub] = useState<ClubName>("7I");
  const [clubTravelDistance, setClubTravelDistance] = useState(
    distanceUnit === "meters" ? 2.1 : 2.3,
  );
  const [swingDurationMs, setSwingDurationMs] = useState(220);
  const [launchAngleDeg, setLaunchAngleDeg] = useState(16);
  const [notes, setNotes] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [fallbackVideoUrl, setFallbackVideoUrl] = useState<string | null>(null);
  const [fallbackVideoName, setFallbackVideoName] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<
    "idle" | "analyzing" | "done" | "error"
  >("idle");
  const [analysisConfidence, setAnalysisConfidence] = useState<number | null>(null);

  const computed = useMemo(() => {
    const travelMeters =
      distanceUnit === "meters"
        ? clubTravelDistance
        : displayDistanceToYards(clubTravelDistance, "yards") * 0.9144;
    const swingDurationSec = Math.max(0.01, swingDurationMs / 1000);
    const swingSpeedMps = travelMeters / swingDurationSec;
    const smashFactor = CLUB_SMASH_FACTOR[club] ?? 1.33;
    const ballSpeedMps = swingSpeedMps * smashFactor;
    const carryMeters = estimateCarryMeters(ballSpeedMps, launchAngleDeg);
    const totalMeters = carryMeters * 1.12;

    return {
      travelMeters,
      swingSpeedMps,
      swingSpeedKmh: swingSpeedMps * 3.6,
      ballSpeedMps,
      ballSpeedKmh: ballSpeedMps * 3.6,
      carryMeters,
      totalMeters,
    };
  }, [club, clubTravelDistance, distanceUnit, launchAngleDeg, swingDurationMs]);

  const startCamera = async () => {
    const hasGetUserMedia =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getUserMedia === "function";
    const isSecureCameraContext =
      typeof window !== "undefined" &&
      (window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!hasGetUserMedia) {
      setCameraError(
        "Live camera API is not available in this browser. Use Chrome/Safari or fallback capture below.",
      );
      setCameraOn(false);
      return;
    }

    if (!isSecureCameraContext) {
      setCameraError(
        "Live camera requires HTTPS (or localhost). Open this app on a secure domain to use Start camera.",
      );
      setCameraOn(false);
      return;
    }

    try {
      setCameraError(null);
      setAnalysisState("idle");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        if (fallbackVideoUrl) {
          URL.revokeObjectURL(fallbackVideoUrl);
          setFallbackVideoUrl(null);
          setFallbackVideoName(null);
        }
        videoRef.current.srcObject = stream;
        videoRef.current.removeAttribute("src");
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Unable to access camera. Check permissions.",
      );
      setCameraOn(false);
    }
  };

  const analyzeSwingAutomatically = async () => {
    if (!videoRef.current) {
      setCameraError("No camera/video source available to analyze.");
      setAnalysisState("error");
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      setCameraError("Video stream is not ready yet. Start camera and try again.");
      setAnalysisState("error");
      return;
    }

    const width = 192;
    const height = 108;
    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
      analysisCanvasRef.current.width = width;
      analysisCanvasRef.current.height = height;
    }

    const canvas = analysisCanvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      setCameraError("Unable to initialize video analysis canvas.");
      setAnalysisState("error");
      return;
    }

    setCameraError(null);
    setAnalysisState("analyzing");
    setAnalysisConfidence(null);

    if (fallbackVideoUrl) {
      video.currentTime = 0;
      try {
        await video.play();
      } catch {
        // User may need to press play manually; proceed with current frame feed.
      }
    }

    const maxAnalyzeMs = fallbackVideoUrl ? 4500 : 2800;
    const startTime = performance.now();
    let previousLuma: Uint8Array | null = null;
    const motionSeries: Array<{ t: number; score: number }> = [];

    while (performance.now() - startTime < maxAnalyzeMs) {
      if (video.readyState >= 2) {
        context.drawImage(video, 0, 0, width, height);
        const image = context.getImageData(0, 0, width, height).data;
        const currentLuma = new Uint8Array(width * height);

        for (let pixel = 0, rgba = 0; pixel < currentLuma.length; pixel += 1, rgba += 4) {
          const r = image[rgba];
          const g = image[rgba + 1];
          const b = image[rgba + 2];
          currentLuma[pixel] = (r * 77 + g * 150 + b * 29) >> 8;
        }

        if (previousLuma) {
          let diffSum = 0;
          for (let i = 0; i < currentLuma.length; i += 1) {
            diffSum += Math.abs(currentLuma[i] - previousLuma[i]);
          }
          const normalizedScore = diffSum / currentLuma.length;
          motionSeries.push({ t: performance.now() - startTime, score: normalizedScore });
        }

        previousLuma = currentLuma;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }

    const detection = detectSwingFromMotion(motionSeries);
    if (!detection) {
      setAnalysisState("error");
      setCameraError(
        "Could not detect a full swing automatically. Keep full body and club in frame, then try again.",
      );
      return;
    }

    const clubTravelMeters = CLUB_TRAVEL_METERS_DEFAULT[club] ?? 2.05;
    const defaultLaunchAngle = CLUB_LAUNCH_ANGLE_DEFAULT[club] ?? 18;
    const displayTravelDistance =
      distanceUnit === "meters"
        ? clubTravelMeters
        : yardsToDisplayDistance(clubTravelMeters / 0.9144, "yards");

    setClubTravelDistance(Number(displayTravelDistance.toFixed(2)));
    setSwingDurationMs(Math.round(detection.durationMs));
    setLaunchAngleDeg(defaultLaunchAngle);
    setAnalysisConfidence(detection.confidence);
    setAnalysisState("done");
  };

  const onFallbackVideoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !videoRef.current) return;

    stopCamera();
    if (fallbackVideoUrl) {
      URL.revokeObjectURL(fallbackVideoUrl);
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setFallbackVideoUrl(objectUrl);
    setFallbackVideoName(selectedFile.name);
    videoRef.current.srcObject = null;
    videoRef.current.src = objectUrl;
    void videoRef.current.play().catch(() => {
      // Silent fallback if autoplay is blocked; user can press play.
    });
  };

  useEffect(() => {
    return () => {
      if (fallbackVideoUrl) {
        URL.revokeObjectURL(fallbackVideoUrl);
      }
    };
  }, [fallbackVideoUrl]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const saveSession = () => {
    onAddSession({
      id: createId(),
      date,
      club,
      clubTravelMeters: computed.travelMeters,
      swingDurationMs,
      swingSpeedMps: computed.swingSpeedMps,
      swingSpeedKmh: computed.swingSpeedKmh,
      ballSpeedMps: computed.ballSpeedMps,
      ballSpeedKmh: computed.ballSpeedKmh,
      launchAngleDeg,
      estimatedCarryMeters: computed.carryMeters,
      estimatedTotalMeters: computed.totalMeters,
      notes: notes.trim() || undefined,
    });
    setNotes("");
  };

  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Training Camera</h3>
        <p className="mt-1 text-sm text-slate-600">
          Uses your phone camera and swing timing inputs to estimate swing speed, ball speed,
          carry, and total distance.
        </p>
        <p className="mt-1 text-xs text-amber-700">
          Estimates are training-grade. For launch-monitor-grade precision, external radar/camera
          hardware calibration is still recommended.
        </p>

        <div className="mt-3 overflow-hidden rounded-xl bg-slate-900">
          <video
            ref={videoRef}
            className="h-[22rem] w-full object-cover sm:h-[28rem]"
            playsInline
            muted
          />
        </div>

        <div className="mt-3 flex gap-2">
          {!cameraOn ? (
            <>
              <button
                type="button"
                onClick={startCamera}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Start camera
              </button>
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white"
              >
                Capture fallback video
              </button>
              <input
                ref={fallbackInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={onFallbackVideoCapture}
                className="hidden"
              />
            </>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Stop camera
            </button>
          )}
        </div>

        {cameraError && <p className="mt-2 text-sm text-rose-600">{cameraError}</p>}
        {fallbackVideoName && (
          <p className="mt-2 text-xs text-slate-600">
            Loaded fallback capture: <span className="font-semibold">{fallbackVideoName}</span>
          </p>
        )}

        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void analyzeSwingAutomatically();
              }}
              disabled={analysisState === "analyzing"}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {analysisState === "analyzing"
                ? "Analyzing swing..."
                : "Auto analyze swing"}
            </button>
            {analysisState === "done" && analysisConfidence !== null && (
              <p className="text-xs text-emerald-700">
                Detection confidence: {(analysisConfidence * 100).toFixed(0)}%
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Auto analysis detects motion timing from the camera feed and fills swing inputs
            automatically.
          </p>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Session Input</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-600">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Club</span>
            <select
              value={club}
              onChange={(event) => setClub(event.target.value as ClubName)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {clubOptions.map((clubOption) => (
                <option key={clubOption} value={clubOption}>
                  {clubOption}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="text-slate-600">
              Club travel distance ({distanceUnitLabel(distanceUnit)})
            </span>
            <input
              type="number"
              step="0.1"
              value={clubTravelDistance}
              onChange={(event) => setClubTravelDistance(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Swing duration (ms)</span>
            <input
              type="number"
              value={swingDurationMs}
              onChange={(event) => setSwingDurationMs(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="text-slate-600">Launch angle (°)</span>
            <input
              type="number"
              step="0.1"
              value={launchAngleDeg}
              onChange={(event) => setLaunchAngleDeg(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="text-slate-600">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Estimated Metrics</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          <MetricCard label="Swing speed" value={`${computed.swingSpeedKmh.toFixed(1)} km/h`} />
          <MetricCard label="Ball speed" value={`${computed.ballSpeedKmh.toFixed(1)} km/h`} />
          <MetricCard label="Launch angle" value={`${launchAngleDeg.toFixed(1)}°`} />
          <MetricCard
            label="Carry"
            value={formatDistanceFromYards(computed.carryMeters / 0.9144, distanceUnit, 1)}
          />
          <MetricCard
            label="Total"
            value={formatDistanceFromYards(computed.totalMeters / 0.9144, distanceUnit, 1)}
          />
        </div>

        <button
          type="button"
          onClick={saveSession}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Save training session
        </button>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Recent Training Sessions</h3>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No sessions logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions
              .slice()
              .reverse()
              .map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">
                      {session.club} · {session.swingSpeedKmh.toFixed(1)} km/h swing
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.date} · Carry{" "}
                      {formatDistanceFromYards(
                        session.estimatedCarryMeters / 0.9144,
                        distanceUnit,
                        1,
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        )}
      </article>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
