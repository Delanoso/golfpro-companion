import { useMemo, useState } from "react";
import { clubOptions, defaultClubBag } from "../../data/defaultData";
import type { ClubName, PlayerProfile } from "../../types/app";

type BagPreset = "standard" | "minimal" | "full";

type OnboardingWizardProps = {
  profile: PlayerProfile;
  onComplete: (nextProfile: PlayerProfile, nextBag: ClubName[]) => void;
};

const bagPresets: Record<BagPreset, ClubName[]> = {
  standard: defaultClubBag,
  minimal: [
    "Driver",
    "5W",
    "4H",
    "6I",
    "8I",
    "PW",
    "54W",
    "Putter",
  ],
  full: clubOptions,
};

export function OnboardingWizard({ profile, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [handicap, setHandicap] = useState<number | "">(profile.handicap);
  const [homeCourse, setHomeCourse] = useState(profile.homeCourse);
  const [preferredTee, setPreferredTee] = useState(profile.preferredTee);
  const [bagPreset, setBagPreset] = useState<BagPreset>("standard");

  const stepTitle = useMemo(() => {
    if (step === 0) return "Welcome to GolfPro Companion";
    if (step === 1) return "Player setup";
    return "Build your bag";
  }, [step]);

  const canContinue = step === 1 ? homeCourse.trim().length > 0 : true;

  const finish = () => {
    onComplete(
      {
        ...profile,
        onboardingCompleted: true,
        handicap,
        homeCourse: homeCourse.trim(),
        preferredTee: preferredTee.trim(),
      },
      bagPresets[bagPreset],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">First-run setup</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{stepTitle}</h2>

        {step === 0 && (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Track rounds hole-by-hole, get personalized caddy recommendations, and run league games.</p>
            <p>This setup takes less than 1 minute.</p>
          </div>
        )}

        {step === 1 && (
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
            <label>
              <span className="text-slate-600">Handicap (optional)</span>
              <input
                type="number"
                min={0}
                max={54}
                step={0.1}
                value={handicap}
                onChange={(event) => setHandicap(event.target.value === "" ? "" : Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label>
              <span className="text-slate-600">Home course</span>
              <input
                value={homeCourse}
                onChange={(event) => setHomeCourse(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="ERPM Golf Club"
              />
            </label>
            <label>
              <span className="text-slate-600">Preferred tee (optional)</span>
              <input
                value={preferredTee}
                onChange={(event) => setPreferredTee(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="White"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-slate-600">Choose a starting bag preset (editable anytime in Clubs settings).</p>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <input
                type="radio"
                name="bagPreset"
                checked={bagPreset === "standard"}
                onChange={() => setBagPreset("standard")}
              />
              <span>Standard bag (recommended)</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <input
                type="radio"
                name="bagPreset"
                checked={bagPreset === "minimal"}
                onChange={() => setBagPreset("minimal")}
              />
              <span>Minimal bag (quick tracking)</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <input
                type="radio"
                name="bagPreset"
                checked={bagPreset === "full"}
                onChange={() => setBagPreset("full")}
              />
              <span>Full list (all clubs)</span>
            </label>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
            disabled={step === 0}
          >
            Back
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(2, current + 1))}
              disabled={!canContinue}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Finish setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
