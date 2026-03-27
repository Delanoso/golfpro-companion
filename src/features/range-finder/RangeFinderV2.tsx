import { useEffect, useMemo, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import type { ClubName, DistanceUnit, RangeFinderLog } from "../../types/app";
import { getClubDistanceStats } from "../../utils/analytics";
import { createId, todayIsoDate } from "../../utils/helpers";
import { formatDistanceFromYards } from "../../utils/units";
import type { ClubShot } from "../../types/app";

type RangeFinderV2Props = {
  distanceUnit: DistanceUnit;
  clubShots: ClubShot[];
  logs: RangeFinderLog[];
  onAddLog: (log: RangeFinderLog) => void;
  onDeleteLog: (id: string) => void;
};

type DetectorStatus = "idle" | "loading" | "ready" | "error";

const FLAGSTICK_HEIGHT_M = 2.13;

function metersToYards(meters: number) {
  return meters / 0.9144;
}

export function RangeFinderV2({
  distanceUnit,
  clubShots,
  logs,
  onAddLog,
  onDeleteLog,
}: RangeFinderV2Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);
  const [detectorStatus, setDetectorStatus] = useState<DetectorStatus>("idle");
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [fallbackVideoUrl, setFallbackVideoUrl] = useState<string | null>(null);
  const [fallbackVideoName, setFallbackVideoName] = useState<string | null>(null);
  const [targetLabel, setTargetLabel] = useState("Flag / Pin");
  const [flagHeightMeters, setFlagHeightMeters] = useState(FLAGSTICK_HEIGHT_M);
  const [focalLengthPx, setFocalLengthPx] = useState(1150);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [detectedClass, setDetectedClass] = useState<string | null>(null);
  const [recommendedClub, setRecommendedClub] = useState<ClubName | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [date] = useState(todayIsoDate());

  const clubStats = useMemo(() => getClubDistanceStats(clubShots), [clubShots]);

  const suggestClub = (yards: number): ClubName | null => {
    if (clubStats.length === 0) return null;
    const closest = clubStats
      .map((club) => ({
        club: club.club as ClubName,
        gap: Math.abs(club.average - yards),
      }))
      .sort((a, b) => a.gap - b.gap)[0];
    return closest?.club ?? null;
  };

  const ensureDetector = async () => {
    if (detectorRef.current) return detectorRef.current;
    try {
      setDetectorStatus("loading");
      setDetectorError(null);
      const detector = await cocoSsd.load({ base: "lite_mobilenet_v2" });
      detectorRef.current = detector;
      setDetectorStatus("ready");
      return detector;
    } catch (error) {
      setDetectorStatus("error");
      setDetectorError(
        error instanceof Error ? error.message : "Unable to load range finder model.",
      );
      return null;
    }
  };

  useEffect(() => {
    void ensureDetector();
  }, []);

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
        "Live camera API is not available in this browser. Use fallback capture below.",
      );
      setCameraOn(false);
      return;
    }

    if (!isSecureCameraContext) {
      setCameraError(
        "Live camera requires HTTPS (or localhost). Use the secure URL to enable camera.",
      );
      setCameraOn(false);
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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
          : "Unable to access camera. Check camera permissions.",
      );
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
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
      // User can press play if autoplay is blocked.
    });
  };

  useEffect(() => {
    return () => {
      if (fallbackVideoUrl) URL.revokeObjectURL(fallbackVideoUrl);
    };
  }, [fallbackVideoUrl]);

  const analyzeRange = async () => {
    if (!videoRef.current) {
      setAnalysisError("No camera/video source available.");
      return;
    }
    const video = videoRef.current;
    if (video.readyState < 2) {
      setAnalysisError("Video not ready. Start camera or load a fallback video.");
      return;
    }

    const detector = await ensureDetector();
    if (!detector) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const predictions = await detector.detect(video, 20);

      // Prefer objects that can represent a near-pin target in v2 prototype.
      const candidates = predictions
        .filter((prediction) =>
          ["person", "sports ball", "bottle", "backpack", "chair", "bird"].includes(
            prediction.class,
          ),
        )
        .sort((a, b) => b.score - a.score);

      const best = candidates[0] ?? predictions.sort((a, b) => b.score - a.score)[0];
      if (!best) {
        setAnalysisError(
          "No object detected. Point camera at flag/target and keep it centered.",
        );
        setAnalyzing(false);
        return;
      }

      const bboxHeightPx = Math.max(1, best.bbox[3]);
      const estimatedMeters = (flagHeightMeters * focalLengthPx) / bboxHeightPx;
      const clampedMeters = Math.min(420, Math.max(5, estimatedMeters));
      const confidenceValue = Math.min(0.99, Math.max(0.2, best.score));
      const club = suggestClub(metersToYards(clampedMeters));

      setDetectedClass(best.class);
      setDistanceMeters(clampedMeters);
      setConfidence(confidenceValue);
      setRecommendedClub(club);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Range analysis failed.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const saveReading = () => {
    if (!distanceMeters || !detectedClass || !confidence) return;
    onAddLog({
      id: createId(),
      date,
      targetLabel,
      estimatedDistanceMeters: distanceMeters,
      confidence,
      detectedClass,
      recommendedClub: recommendedClub ?? undefined,
    });
  };

  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Range Finder v2</h3>
        <p className="mt-1 text-sm text-slate-600">
          Camera + AI detection + calibration controls. Aim at the flag area and run Analyze.
        </p>
        <p className="mt-1 text-xs text-amber-700">
          Flag detection is estimate-based in v2. Calibrate focal length for your phone for better
          accuracy.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl bg-slate-900">
          <video
            ref={videoRef}
            className="h-[22rem] w-full object-cover sm:h-[28rem]"
            playsInline
            muted
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
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

          <button
            type="button"
            onClick={() => {
              void analyzeRange();
            }}
            disabled={analyzing || detectorStatus === "loading"}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {analyzing ? "Analyzing..." : "Analyze range"}
          </button>
        </div>

        {cameraError && <p className="mt-2 text-sm text-rose-600">{cameraError}</p>}
        {detectorError && <p className="mt-2 text-sm text-rose-600">{detectorError}</p>}
        {analysisError && <p className="mt-2 text-sm text-rose-600">{analysisError}</p>}
        {fallbackVideoName && (
          <p className="mt-2 text-xs text-slate-600">
            Loaded fallback capture: <span className="font-semibold">{fallbackVideoName}</span>
          </p>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Calibration & Target</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-600">Target label</span>
            <input
              value={targetLabel}
              onChange={(event) => setTargetLabel(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Assumed flag height (m)</span>
            <input
              type="number"
              step="0.01"
              value={flagHeightMeters}
              onChange={(event) => setFlagHeightMeters(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Focal length calibration (px)</span>
            <input
              type="number"
              value={focalLengthPx}
              onChange={(event) => setFocalLengthPx(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Detector status:{" "}
            <span className="font-semibold">
              {detectorStatus === "ready"
                ? "Ready"
                : detectorStatus === "loading"
                  ? "Loading model"
                  : detectorStatus === "error"
                    ? "Error"
                    : "Idle"}
            </span>
          </div>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Distance Result</h3>
        {distanceMeters ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-700">
              Detected object: <span className="font-semibold">{detectedClass}</span>
            </p>
            <p className="text-lg font-bold text-slate-900">
              {formatDistanceFromYards(metersToYards(distanceMeters), distanceUnit, 1)}
            </p>
            <p className="text-sm text-slate-700">
              Confidence:{" "}
              <span className="font-semibold">{confidence ? `${(confidence * 100).toFixed(0)}%` : "--"}</span>
            </p>
            <p className="text-sm text-slate-700">
              Recommended club:{" "}
              <span className="font-semibold">{recommendedClub ?? "Add club shots for suggestions"}</span>
            </p>
            <button
              type="button"
              onClick={saveReading}
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Save reading
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Run Analyze range to detect target distance.</p>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Range Finder History</h3>
        {logs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No range readings saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {logs
              .slice()
              .reverse()
              .map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">
                      {log.targetLabel} · {formatDistanceFromYards(metersToYards(log.estimatedDistanceMeters), distanceUnit, 1)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {log.date} · {log.detectedClass} · {(log.confidence * 100).toFixed(0)}% ·{" "}
                      {log.recommendedClub ? `Club ${log.recommendedClub}` : "No club recommendation"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteLog(log.id)}
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
