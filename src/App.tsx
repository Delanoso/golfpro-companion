import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppSectionBar } from "./components/AppSectionBar";
import { AppTabBar, type AppTab } from "./components/AppTabBar";
import { initialAppData } from "./data/defaultData";
import { BettingGameTracker } from "./features/betting/BettingGameTracker";
import { ClubDistanceTracker } from "./features/clubs/ClubDistanceTracker";
import { AnalyticsDashboard } from "./features/dashboard/AnalyticsDashboard";
import { LeagueManager } from "./features/league/LeagueManager";
import { RoundEntryForm } from "./features/rounds/RoundEntryForm";
import { SmartCaddy } from "./features/strategy/SmartCaddy";
import { TrainingCamera } from "./features/training/TrainingCamera";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import type {
  AppSection,
  AppData,
  BettingGame,
  ClubShot,
  DistanceUnit,
  LeagueRound,
  RoundEntry,
} from "./types/app";

type AppProps = {
  currentUser: User;
  onSignOut: () => Promise<void>;
};

function normalizeAppData(data: AppData): AppData {
  return {
    ...initialAppData,
    ...data,
    trainingSessions: data.trainingSessions ?? [],
    leagueSettings: {
      ...initialAppData.leagueSettings,
      ...data.leagueSettings,
    },
  };
}

function App({ currentUser, onSignOut }: AppProps) {
  const [activeSection, setActiveSection] = useState<AppSection>("golf-strategy");
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [data, setData] = useLocalStorageState<AppData>(
    `golfpro-companion-data-${currentUser.id}`,
    initialAppData,
  );
  const [distanceUnit, setDistanceUnit] = useLocalStorageState<DistanceUnit>(
    `golfpro-companion-distance-unit-${currentUser.id}`,
    "meters",
  );
  const appData = normalizeAppData(data);

  const updateData = (updater: (current: AppData) => AppData) => {
    setData((current) => updater(normalizeAppData(current)));
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

  const deleteClubShot = (id: string) => {
    updateData((current) => ({
      ...current,
      clubShots: current.clubShots.filter((shot) => shot.id !== id),
    }));
  };

  const addBettingGame = (game: BettingGame) => {
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

  const addTrainingSession = (session: AppData["trainingSessions"][number]) => {
    updateData((current) => ({
      ...current,
      trainingSessions: [...current.trainingSessions, session],
    }));
  };

  const deleteTrainingSession = (id: string) => {
    updateData((current) => ({
      ...current,
      trainingSessions: current.trainingSessions.filter((session) => session.id !== id),
    }));
  };

  const resetAllData = () => {
    setData(initialAppData);
  };

  const displayName =
    (typeof currentUser.user_metadata?.display_name === "string" &&
      currentUser.user_metadata.display_name.trim()) ||
    currentUser.email?.split("@")[0] ||
    "Player";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-4xl px-4 pb-8">
        <header className="pt-4">
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
                Signed in as <span className="font-semibold">{displayName}</span>
              </p>
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
              <button
                type="button"
                onClick={resetAllData}
                className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                Reset data
              </button>
              <button
                type="button"
                onClick={() => {
                  void onSignOut();
                }}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Logout
              </button>
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
                  rounds={appData.rounds}
                  onAddRound={addRound}
                  onDeleteRound={deleteRound}
                />
              )}

              {activeTab === "clubs" && (
                <ClubDistanceTracker
                  distanceUnit={distanceUnit}
                  clubShots={appData.clubShots}
                  onAddShot={addClubShot}
                  onDeleteShot={deleteClubShot}
                />
              )}

              {activeTab === "strategy" && (
                <SmartCaddy distanceUnit={distanceUnit} clubShots={appData.clubShots} />
              )}

              {activeTab === "betting" && (
                <BettingGameTracker
                  data={appData}
                  onAddGame={addBettingGame}
                  onDeleteGame={deleteBettingGame}
                />
              )}

              {activeTab === "league" && (
                <LeagueManager
                  data={appData}
                  onUpdateSettings={updateLeagueSettings}
                  onAddRound={addLeagueRound}
                  onDeleteRound={deleteLeagueRound}
                />
              )}
            </>
          )}

          {activeSection === "training" && (
            <TrainingCamera
              distanceUnit={distanceUnit}
              sessions={appData.trainingSessions}
              onAddSession={addTrainingSession}
              onDeleteSession={deleteTrainingSession}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
