import { useEffect, useState } from "react";
import type { LatLng, WeatherSnapshot } from "../types/golf";

type UseWeatherResult = {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
};

export function useWeather(location: LatLng | null): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (!location) {
      return;
    }

    if (!apiKey) {
      setError("Add VITE_OPENWEATHER_API_KEY in your .env file.");
      setWeather(null);
      return;
    }

    const controller = new AbortController();

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lng}&units=metric&appid=${apiKey}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to load weather data.");
        }

        const payload = await response.json();
        const now = payload.list?.[0];

        if (!now) {
          throw new Error("Weather data is unavailable right now.");
        }

        setWeather({
          temperatureC: now.main.temp,
          windSpeedKmh: now.wind.speed * 3.6,
          windDirectionDeg: now.wind.deg ?? 0,
          rainProbability: (now.pop ?? 0) * 100,
          description: now.weather?.[0]?.description ?? "N/A",
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setWeather(null);
          setError(err instanceof Error ? err.message : "Weather request failed.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchWeather();

    return () => {
      controller.abort();
    };
  }, [location]);

  return { weather, loading, error };
}
