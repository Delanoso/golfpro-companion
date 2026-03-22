import type { Course, Hole, LatLng } from "../types/golf";

const metersToLatitude = (meters: number) => meters / 111_320;

const metersToLongitude = (meters: number, latitude: number) =>
  meters / (111_320 * Math.cos((latitude * Math.PI) / 180));

const move = (origin: LatLng, northMeters: number, eastMeters: number): LatLng => ({
  lat: origin.lat + metersToLatitude(northMeters),
  lng: origin.lng + metersToLongitude(eastMeters, origin.lat),
});

type HoleBlueprint = {
  par: number;
  yardage: number;
  teeNorth: number;
  teeEast: number;
  greenNorth: number;
  greenEast: number;
  fairwayCurve: number;
};

const holeBlueprints: HoleBlueprint[] = [
  { par: 4, yardage: 352, teeNorth: -280, teeEast: -120, greenNorth: -20, greenEast: 50, fairwayCurve: 18 },
  { par: 5, yardage: 501, teeNorth: -350, teeEast: 80, greenNorth: -40, greenEast: 260, fairwayCurve: -22 },
  { par: 3, yardage: 168, teeNorth: -110, teeEast: -300, greenNorth: 20, greenEast: -180, fairwayCurve: 10 },
  { par: 4, yardage: 396, teeNorth: 40, teeEast: -360, greenNorth: 210, greenEast: -110, fairwayCurve: -16 },
  { par: 4, yardage: 412, teeNorth: 250, teeEast: -280, greenNorth: 420, greenEast: -20, fairwayCurve: 20 },
  { par: 5, yardage: 527, teeNorth: 500, teeEast: -60, greenNorth: 300, greenEast: 260, fairwayCurve: -28 },
  { par: 3, yardage: 179, teeNorth: 260, teeEast: 320, greenNorth: 150, greenEast: 430, fairwayCurve: 8 },
  { par: 4, yardage: 388, teeNorth: 80, teeEast: 360, greenNorth: -120, greenEast: 200, fairwayCurve: -15 },
  { par: 4, yardage: 405, teeNorth: -170, teeEast: 280, greenNorth: -320, greenEast: 60, fairwayCurve: 15 },
  { par: 4, yardage: 371, teeNorth: -420, teeEast: -40, greenNorth: -260, greenEast: -250, fairwayCurve: -16 },
  { par: 5, yardage: 532, teeNorth: -350, teeEast: -300, greenNorth: -60, greenEast: -470, fairwayCurve: 24 },
  { par: 3, yardage: 171, teeNorth: -60, teeEast: -460, greenNorth: 80, greenEast: -360, fairwayCurve: -6 },
  { par: 4, yardage: 401, teeNorth: 140, teeEast: -430, greenNorth: 320, greenEast: -230, fairwayCurve: 19 },
  { par: 4, yardage: 422, teeNorth: 340, teeEast: -220, greenNorth: 520, greenEast: -40, fairwayCurve: -13 },
  { par: 5, yardage: 549, teeNorth: 560, teeEast: 20, greenNorth: 320, greenEast: 300, fairwayCurve: 26 },
  { par: 3, yardage: 162, teeNorth: 330, teeEast: 330, greenNorth: 210, greenEast: 420, fairwayCurve: -4 },
  { par: 4, yardage: 389, teeNorth: 120, teeEast: 430, greenNorth: -90, greenEast: 260, fairwayCurve: 14 },
  { par: 4, yardage: 417, teeNorth: -130, teeEast: 340, greenNorth: -300, greenEast: 120, fairwayCurve: -18 },
];

const buildHole = (courseCenter: LatLng, blueprint: HoleBlueprint, index: number): Hole => {
  const teePosition = move(courseCenter, blueprint.teeNorth, blueprint.teeEast);
  const greenFront = move(courseCenter, blueprint.greenNorth, blueprint.greenEast);
  const greenCenter = move(greenFront, 8, 3);

  const midNorth = (blueprint.teeNorth + blueprint.greenNorth) / 2;
  const midEast = (blueprint.teeEast + blueprint.greenEast) / 2;
  const fairwayTurn = move(courseCenter, midNorth, midEast + blueprint.fairwayCurve);
  const fairwayPath = [teePosition, fairwayTurn, greenFront];

  return {
    id: index + 1,
    name: `Hole ${index + 1}`,
    par: blueprint.par,
    yardage: blueprint.yardage,
    teePosition,
    fairwayPath,
    green: {
      front: greenFront,
      center: greenCenter,
    },
  };
};

const sunwardParkCenter: LatLng = { lat: -26.1947, lng: 28.2645 };

export const mockCourses: Course[] = [
  {
    id: "sunward-park-machie",
    name: "Sunward Park Machie",
    locationLabel: "Boksburg, South Africa",
    center: sunwardParkCenter,
    holes: holeBlueprints.map((blueprint, index) => buildHole(sunwardParkCenter, blueprint, index)),
  },
];
