import type { WeatherSnapshot } from "../types/golf";
import { toCompassDirection } from "../utils/distance";

type WeatherCardProps = {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
};

export function WeatherCard({ weather, loading, error }: WeatherCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Loading weather...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">No weather data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-base font-semibold text-slate-900">Current Course Weather</h3>
      <p className="mt-1 text-sm capitalize text-slate-600">{weather.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Temperature</p>
          <p className="text-lg font-bold text-slate-900">{weather.temperatureC.toFixed(1)}°C</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Rain chance</p>
          <p className="text-lg font-bold text-slate-900">{weather.rainProbability.toFixed(0)}%</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Wind speed</p>
          <p className="text-lg font-bold text-slate-900">{weather.windSpeedKmh.toFixed(1)} km/h</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Wind direction</p>
          <p className="text-lg font-bold text-slate-900">
            {toCompassDirection(weather.windDirectionDeg)} ({Math.round(weather.windDirectionDeg)}°)
          </p>
        </div>
      </div>
    </div>
  );
}
