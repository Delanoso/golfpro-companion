import type { LatLng } from "../types/golf";

const EARTH_RADIUS_M = 6_371_000;

const toRadians = (value: number) => (value * Math.PI) / 180;

export function getDistanceMeters(start: LatLng, end: LatLng): number {
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function formatRelativeToPar(value: number): string {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
}

export function toCompassDirection(deg: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}
