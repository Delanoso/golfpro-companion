import { useEffect, useState } from "react";
import type { LatLng } from "../types/golf";

type GeolocationState = {
  position: LatLng | null;
  error: string | null;
  isTracking: boolean;
};

export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setIsTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      (geoPosition) => {
        setPosition({
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude,
        });
        setError(null);
      },
      (watchError) => {
        setError(watchError.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 1_000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, []);

  return { position, error, isTracking };
}
