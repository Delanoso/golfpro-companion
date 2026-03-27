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
          <video ref={videoRef} className="h-56 w-full object-cover" playsInline muted />
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
