import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppSectionBar } from "./components/AppSectionBar";
import { AppTabBar, type AppTab } from "./components/AppTabBar";
import { clubOptions, initialAppData } from "./data/defaultData";
import { ClubDistanceTracker } from "./features/clubs/ClubDistanceTracker";
import { AnalyticsDashboard } from "./features/dashboard/AnalyticsDashboard";
import { BettingGamesManager } from "./features/games/BettingGamesManager";
import { LeagueManager } from "./features/league/LeagueManager";
import { MiniTourModal } from "./features/onboarding/MiniTourModal";
import { OnboardingWizard } from "./features/onboarding/OnboardingWizard";
import { RoundEntryForm } from "./features/rounds/RoundEntryForm";
import { AccountSettingsModal } from "./features/settings/AccountSettingsModal";
import { SmartCaddy } from "./features/strategy/SmartCaddy";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { loadPlayerAppData, savePlayerAppData, subscribeToPlayerAppData } from "./services/appDataSyncService";
import { getPlayerProfile } from "./services/playerProfileService";
import type {
  AppSection,
  AppData,
  ClubShot,
  DistanceUnit,
  LeagueRound,
  RoundEntry,
} from "./types/app";

type AppProps = {
  currentUser: User;
  onSignOut: () => Promise<void>;
};

const parseIsoMs = (value: string | undefined | null) => {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
};

function normalizeAppData(data: AppData): AppData {
  const withDefaults = {
    ...initialAppData,
    ...data,
  };
  return {
    ...withDefaults,
    profile: {
      ...initialAppData.profile,
      ...(data.profile ?? {}),
    },
    syncMeta: {
      ...initialAppData.syncMeta,
      ...(data.syncMeta ?? {}),
    },
    leagueSettings: {
      ...initialAppData.leagueSettings,
      ...data.leagueSettings,
    },
  };
}

function App({ currentUser, onSignOut }: AppProps) {
  const [activeSection, setActiveSection] = useState<AppSection>("golf-strategy");
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "offline">("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [showMiniTour, setShowMiniTour] = useState(false);
  const [data, setData] = useLocalStorageState<AppData>(
    `golfpro-companion-data-${currentUser.id}`,
    initialAppData,
  );
  const [distanceUnit, setDistanceUnit] = useLocalStorageState<DistanceUnit>(
    `golfpro-companion-distance-unit-${currentUser.id}`,
    "meters",
  );
  const appData = normalizeAppData(data);
  const appDataRef = useRef(appData);
  const lastSyncedPayloadRef = useRef<string>("");
  const isApplyingRemoteRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);

  const applyDataWithoutTouch = (nextData: AppData) => {
    isApplyingRemoteRef.current = true;
    setData(normalizeAppData(nextData));
    window.setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 0);
  };

  const updateData = (updater: (current: AppData) => AppData, touchTimestamp = true) => {
    setData((current) => {
      const next = normalizeAppData(updater(normalizeAppData(current)));
      if (!touchTimestamp) return next;
      return {
        ...next,
        syncMeta: {
          ...next.syncMeta,
          lastModifiedAt: new Date().toISOString(),
        },
      };
    });
  };

  const addRound = (round: RoundEntry) => {
    updateData((current) => ({
      ...current,
      rounds: [...current.rounds, round],
    }));
  };

  const deleteRound = (id: string) => {
    updateData((current) => ({
      ...current,
      rounds: current.rounds.filter((round) => round.id !== id),
    }));
  };

  const addClubShot = (shot: ClubShot) => {
    updateData((current) => ({
      ...current,
      clubShots: [...current.clubShots, shot],
    }));
  };

  const updateClubBag = (clubs: ClubShot["club"][]) => {
    const selectedSet = new Set(clubs);
    const ordered = clubOptions.filter((club) => selectedSet.has(club));
    updateData((current) => ({
      ...current,
      clubBag: ordered,
    }));
  };

  const deleteClubShot = (id: string) => {
    updateData((current) => ({
      ...current,
      clubShots: current.clubShots.filter((shot) => shot.id !== id),
    }));
  };

  const addBettingGame = (game: AppData["bettingGames"][number]) => {
    updateData((current) => ({
      ...current,
      bettingGames: [...current.bettingGames, game],
    }));
  };

  const deleteBettingGame = (id: string) => {
    updateData((current) => ({
      ...current,
      bettingGames: current.bettingGames.filter((game) => game.id !== id),
    }));
  };

  const updateLeagueSettings = (settings: AppData["leagueSettings"]) => {
    updateData((current) => ({
      ...current,
      leagueSettings: settings,
    }));
  };

  const addLeagueRound = (round: LeagueRound) => {
    updateData((current) => ({
      ...current,
      leagueRounds: [...current.leagueRounds, round],
    }));
  };

  const deleteLeagueRound = (id: string) => {
    updateData((current) => ({
      ...current,
      leagueRounds: current.leagueRounds.filter((round) => round.id !== id),
    }));
  };

  const resetAllData = () => {
    setData({
      ...initialAppData,
      syncMeta: {
        lastModifiedAt: new Date().toISOString(),
      },
    });
  };

  const requestResetAllData = () => {
    setIsMenuOpen(false);
    setIsResetConfirmOpen(true);
  };

  const confirmResetAllData = () => {
    resetAllData();
    setIsResetConfirmOpen(false);
  };

  const syncStatusLabel = useMemo(() => {
    if (syncStatus === "syncing") return "Syncing cloud data...";
    if (syncStatus === "offline") return "Cloud sync paused (will retry).";
    if (syncStatus === "synced") {
      const label = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : "just now";
      return `Synced ${label}`;
    }
    return "Cloud sync idle";
  }, [lastSyncedAt, syncStatus]);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setCloudReady(false);
      setSyncStatus("syncing");
      setSyncError(null);
      try {
        const [remoteSnapshot, profile] = await Promise.all([
          loadPlayerAppData(currentUser.id),
          getPlayerProfile(currentUser.id),
        ]);
        if (!active) return;

        const localData = appDataRef.current;
        const remoteData = remoteSnapshot.data ? normalizeAppData(remoteSnapshot.data) : null;
        const localMs = parseIsoMs(localData.syncMeta.lastModifiedAt);
        const remoteMs = Math.max(
          parseIsoMs(remoteData?.syncMeta.lastModifiedAt),
          parseIsoMs(remoteSnapshot.updatedAt),
        );

        if (remoteData && remoteMs >= localMs) {
          applyDataWithoutTouch(remoteData);
          const payload = JSON.stringify(remoteData);
          lastSyncedPayloadRef.current = payload;
          setLastSyncedAt(remoteSnapshot.updatedAt);
        } else if (!remoteData) {
          setLastSyncedAt(null);
        }

        if (profile) {
          updateData(
            (current) => ({
              ...current,
              profile: {
                ...current.profile,
                publicShareEnabled: profile.publicProfile,
                shareCode: profile.shareCode ?? "",
              },
            }),
            false,
          );
        }

        setCloudReady(true);
        setSyncStatus("synced");
      } catch (error) {
        if (!active) return;
        setCloudReady(true);
        setSyncStatus("offline");
        setSyncError(error instanceof Error ? error.message : "Unable to load cloud data.");
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  useEffect(() => {
    if (!cloudReady || isApplyingRemoteRef.current) return;

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    const payload = JSON.stringify(appData);
    if (payload === lastSyncedPayloadRef.current) return;

    syncTimerRef.current = window.setTimeout(() => {
      const run = async () => {
        setSyncStatus("syncing");
        setSyncError(null);
        try {
          const updatedAt = await savePlayerAppData(currentUser.id, appDataRef.current);
          lastSyncedPayloadRef.current = JSON.stringify(appDataRef.current);
          setLastSyncedAt(updatedAt);
          setSyncStatus("synced");
        } catch (error) {
          setSyncStatus("offline");
          setSyncError(error instanceof Error ? error.message : "Unable to sync to cloud.");
        }
      };
      void run();
    }, 700);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [appData, cloudReady, currentUser.id]);

  useEffect(() => {
    const unsubscribe = subscribeToPlayerAppData(currentUser.id, (snapshot) => {
      if (!snapshot.data) return;
      const next = normalizeAppData(snapshot.data);
      const nextPayload = JSON.stringify(next);
      const currentPayload = JSON.stringify(appDataRef.current);
      if (nextPayload === currentPayload) {
        lastSyncedPayloadRef.current = currentPayload;
        setLastSyncedAt(snapshot.updatedAt);
        setSyncStatus("synced");
        return;
      }
      applyDataWithoutTouch(next);
      lastSyncedPayloadRef.current = nextPayload;
      setLastSyncedAt(snapshot.updatedAt);
      setSyncStatus("synced");
    });
    return unsubscribe;
  }, [currentUser.id]);

  useEffect(() => {
    if (!appData.profile.onboardingCompleted) return;
    if (appData.profile.miniTourCompleted) return;
    setShowMiniTour(true);
  }, [appData.profile.miniTourCompleted, appData.profile.onboardingCompleted]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-4xl px-4 pb-8">
        <header className="relative z-30 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            GolfPro Companion · Rebuilt
          </p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Personal Stats + Strategy Suite</h1>
              <p className="text-sm text-slate-600">
                Track advanced performance, social games, custom league scoring, and club-based recommendations.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Signed in as <span className="font-semibold">{currentUser.email ?? "Player"}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">{syncStatusLabel}</p>
              {syncError && <p className="mt-1 text-xs text-rose-600">{syncError}</p>}
            </div>
            <div className="flex items-center gap-2 self-start">
              <label className="text-xs font-semibold text-slate-600">
                Distance unit
                <select
                  value={distanceUnit}
                  onChange={(event) => setDistanceUnit(event.target.value as DistanceUnit)}
                  className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                >
                  <option value="meters">Meters (default)</option>
                  <option value="yards">Yards</option>
                </select>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Menu
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsAccountSettingsOpen(true);
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Account settings
                    </button>
                    <button
                      type="button"
                      onClick={requestResetAllData}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Reset data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void onSignOut();
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <AppSectionBar activeSection={activeSection} onChange={setActiveSection} />
        {activeSection === "golf-strategy" && (
          <AppTabBar activeTab={activeTab} onChange={setActiveTab} title="Golf Strategy" />
        )}

        <section className="mt-4">
          {activeSection === "golf-strategy" && (
            <>
              {activeTab === "dashboard" && (
                <AnalyticsDashboard data={appData} distanceUnit={distanceUnit} />
              )}

              {activeTab === "rounds" && (
                <RoundEntryForm
                  distanceUnit={distanceUnit}
                  draftStorageKey={`golfpro-companion-round-draft-${currentUser.id}`}
                  rounds={appData.rounds}
                  onAddRound={addRound}
                  onDeleteRound={deleteRound}
                />
              )}

              {activeTab === "clubs" && (
                <ClubDistanceTracker
                  distanceUnit={distanceUnit}
                  clubShots={appData.clubShots}
                  selectedClubs={appData.clubBag}
                  onAddShot={addClubShot}
                  onChangeSelectedClubs={updateClubBag}
                  onDeleteShot={deleteClubShot}
                />
              )}

              {activeTab === "strategy" && (
                <SmartCaddy distanceUnit={distanceUnit} clubShots={appData.clubShots} />
              )}

              {activeTab === "games" && (
                <BettingGamesManager
                  games={appData.bettingGames}
                  onAddGame={addBettingGame}
                  onDeleteGame={deleteBettingGame}
                />
              )}

              {activeTab === "league" && (
                <LeagueManager
                  currentUser={currentUser}
                  data={appData}
                  rounds={appData.rounds}
                  onUpdateSettings={updateLeagueSettings}
                  onAddRound={addLeagueRound}
                  onDeleteRound={deleteLeagueRound}
                />
              )}
            </>
          )}
        </section>
      </main>

      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">Reset all data?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to reset your saved data? This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetAllData}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {!appData.profile.onboardingCompleted && (
        <OnboardingWizard
          profile={appData.profile}
          onComplete={(nextProfile, nextBag) => {
            updateData(
              (current) => ({
                ...current,
                profile: nextProfile,
                clubBag: nextBag,
              }),
              true,
            );
            setActiveTab("rounds");
          }}
        />
      )}

      {showMiniTour && (
        <MiniTourModal
          onDone={() => {
            setShowMiniTour(false);
            updateData(
              (current) => ({
                ...current,
                profile: {
                  ...current.profile,
                  miniTourCompleted: true,
                },
              }),
              true,
            );
          }}
        />
      )}

      {isAccountSettingsOpen && (
        <AccountSettingsModal
          user={currentUser}
          profile={appData.profile}
          onClose={() => setIsAccountSettingsOpen(false)}
          onUpdateProfile={(partialProfile) => {
            updateData(
              (current) => ({
                ...current,
                profile: {
                  ...current.profile,
                  ...partialProfile,
                },
              }),
              true,
            );
          }}
        />
      )}
    </div>
  );
}

export default App;
