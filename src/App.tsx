import { useState } from "react";
import { AppTabBar, type AppTab } from "./components/AppTabBar";
import { initialAppData } from "./data/defaultData";
import { BettingGameTracker } from "./features/betting/BettingGameTracker";
import { ClubDistanceTracker } from "./features/clubs/ClubDistanceTracker";
import { AnalyticsDashboard } from "./features/dashboard/AnalyticsDashboard";
import { LeagueManager } from "./features/league/LeagueManager";
import { RoundEntryForm } from "./features/rounds/RoundEntryForm";
import { SmartCaddy } from "./features/strategy/SmartCaddy";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import type { AppData, BettingGame, ClubShot, LeagueRound, RoundEntry } from "./types/app";

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [data, setData] = useLocalStorageState<AppData>("golfpro-companion-v2", initialAppData);

  const addRound = (round: RoundEntry) => {
    setData((current) => ({
      ...current,
      rounds: [...current.rounds, round],
    }));
  };

  const deleteRound = (id: string) => {
    setData((current) => ({
      ...current,
      rounds: current.rounds.filter((round) => round.id !== id),
    }));
  };

  const addClubShot = (shot: ClubShot) => {
    setData((current) => ({
      ...current,
      clubShots: [...current.clubShots, shot],
    }));
  };

  const deleteClubShot = (id: string) => {
    setData((current) => ({
      ...current,
      clubShots: current.clubShots.filter((shot) => shot.id !== id),
    }));
  };

  const addBettingGame = (game: BettingGame) => {
    setData((current) => ({
      ...current,
      bettingGames: [...current.bettingGames, game],
    }));
  };

  const deleteBettingGame = (id: string) => {
    setData((current) => ({
      ...current,
      bettingGames: current.bettingGames.filter((game) => game.id !== id),
    }));
  };

  const updateLeagueSettings = (settings: AppData["leagueSettings"]) => {
    setData((current) => ({
      ...current,
      leagueSettings: settings,
    }));
  };

  const addLeagueRound = (round: LeagueRound) => {
    setData((current) => ({
      ...current,
      leagueRounds: [...current.leagueRounds, round],
    }));
  };

  const deleteLeagueRound = (id: string) => {
    setData((current) => ({
      ...current,
      leagueRounds: current.leagueRounds.filter((round) => round.id !== id),
    }));
  };

  const resetAllData = () => {
    setData(initialAppData);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-4xl px-4 pb-8">
        <header className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            GolfPro Companion · Rebuilt
          </p>
          <div className="mt-1 flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Personal Stats + Strategy Suite</h1>
              <p className="text-sm text-slate-600">
                Track advanced performance, social games, custom league scoring, and club-based recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAllData}
              className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
            >
              Reset data
            </button>
          </div>
        </header>

        <AppTabBar activeTab={activeTab} onChange={setActiveTab} />

        <section className="mt-4">
          {activeTab === "dashboard" && <AnalyticsDashboard data={data} />}

          {activeTab === "rounds" && (
            <RoundEntryForm rounds={data.rounds} onAddRound={addRound} onDeleteRound={deleteRound} />
          )}

          {activeTab === "clubs" && (
            <ClubDistanceTracker
              clubShots={data.clubShots}
              onAddShot={addClubShot}
              onDeleteShot={deleteClubShot}
            />
          )}

          {activeTab === "strategy" && <SmartCaddy clubShots={data.clubShots} />}

          {activeTab === "betting" && (
            <BettingGameTracker data={data} onAddGame={addBettingGame} onDeleteGame={deleteBettingGame} />
          )}

          {activeTab === "league" && (
            <LeagueManager
              data={data}
              onUpdateSettings={updateLeagueSettings}
              onAddRound={addLeagueRound}
              onDeleteRound={deleteLeagueRound}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
