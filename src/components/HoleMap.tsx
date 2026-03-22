import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Hole, LatLng } from "../types/golf";

type HoleMapProps = {
  hole: Hole;
  userPosition: LatLng | null;
};

function MapFocus({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 17, { animate: false });
  }, [center, map]);

  return null;
}

export function HoleMap({ hole, userPosition }: HoleMapProps) {
  const coursePath = useMemo<LatLngExpression[]>(
    () => hole.fairwayPath.map((point) => [point.lat, point.lng]),
    [hole],
  );

  const centerPoint = useMemo<LatLngExpression>(
    () => [hole.green.center.lat, hole.green.center.lng],
    [hole],
  );

  const frontPoint = useMemo<LatLngExpression>(
    () => [hole.green.front.lat, hole.green.front.lng],
    [hole],
  );

  const teePoint = useMemo<LatLngExpression>(
    () => [hole.teePosition.lat, hole.teePosition.lng],
    [hole],
  );

  const userPoint = userPosition ? ([userPosition.lat, userPosition.lng] as LatLngExpression) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <MapContainer
        center={centerPoint}
        zoom={17}
        className="h-80 w-full"
        scrollWheelZoom
        dragging
        doubleClickZoom
      >
        <MapFocus center={centerPoint} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={coursePath} pathOptions={{ color: "#16a34a", weight: 5 }} />
        <Circle center={centerPoint} radius={20} pathOptions={{ color: "#15803d", fillOpacity: 0.25 }} />
        <Circle center={frontPoint} radius={8} pathOptions={{ color: "#f97316", fillOpacity: 0.5 }} />
        <CircleMarker center={teePoint} radius={7} pathOptions={{ color: "#0f172a" }} />
        <CircleMarker center={centerPoint} radius={7} pathOptions={{ color: "#16a34a" }} />
        <CircleMarker center={frontPoint} radius={5} pathOptions={{ color: "#f97316" }} />

        {userPoint && (
          <>
            <CircleMarker center={userPoint} radius={7} pathOptions={{ color: "#2563eb" }} />
            <Polyline positions={[userPoint, centerPoint]} pathOptions={{ color: "#2563eb", dashArray: "6,4" }} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
