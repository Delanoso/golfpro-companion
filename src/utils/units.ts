import type { DistanceUnit } from "../types/app";

const METERS_PER_YARD = 0.9144;

export function distanceUnitLabel(unit: DistanceUnit): string {
  return unit === "meters" ? "m" : "yd";
}

export function yardsToDisplayDistance(yards: number, unit: DistanceUnit): number {
  return unit === "meters" ? yards * METERS_PER_YARD : yards;
}

export function displayDistanceToYards(value: number, unit: DistanceUnit): number {
  return unit === "meters" ? value / METERS_PER_YARD : value;
}

export function formatDistanceFromYards(
  yards: number,
  unit: DistanceUnit,
  decimals = 1,
): string {
  const displayValue = yardsToDisplayDistance(yards, unit);
  return `${displayValue.toFixed(decimals)} ${distanceUnitLabel(unit)}`;
}

export function formatRangeFromYards(
  minYards: number,
  maxYards: number,
  unit: DistanceUnit,
): string {
  const min = yardsToDisplayDistance(minYards, unit);
  const max = yardsToDisplayDistance(maxYards, unit);
  return `${Math.round(min)}-${Math.round(max)} ${distanceUnitLabel(unit)}`;
}
