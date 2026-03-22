import type { Course, Hole, LatLng } from "../types/golf";
type EditableHoleCoordinates = {
  id: number;
  par: number;
  yardage: number;
  tee: LatLng;
  greenFront: LatLng;
  greenCenter: LatLng;
  fairwayPath: LatLng[];
};

// Replace each hole's coordinates with real values from your course mapping source.
// Keep this shape so you can paste data hole-by-hole quickly.
const sunwardParkMachieHoleCoordinates: EditableHoleCoordinates[] = [
  {
    id: 1,
    par: 4,
    yardage: 352,
    tee: { lat: -26.197215, lng: 28.263299 },
    greenFront: { lat: -26.19488, lng: 28.265001 },
    greenCenter: { lat: -26.194808, lng: 28.265031 },
    fairwayPath: [
      { lat: -26.197215, lng: 28.263299 },
      { lat: -26.196047, lng: 28.26433 },
      { lat: -26.19488, lng: 28.265001 },
    ],
  },
  {
    id: 2,
    par: 5,
    yardage: 501,
    tee: { lat: -26.197844, lng: 28.265301 },
    greenFront: { lat: -26.195059, lng: 28.267103 },
    greenCenter: { lat: -26.194987, lng: 28.267133 },
    fairwayPath: [
      { lat: -26.197844, lng: 28.265301 },
      { lat: -26.196452, lng: 28.265982 },
      { lat: -26.195059, lng: 28.267103 },
    ],
  },
  {
    id: 3,
    par: 3,
    yardage: 168,
    tee: { lat: -26.195688, lng: 28.261497 },
    greenFront: { lat: -26.19452, lng: 28.262698 },
    greenCenter: { lat: -26.194448, lng: 28.262728 },
    fairwayPath: [
      { lat: -26.195688, lng: 28.261497 },
      { lat: -26.195104, lng: 28.262197 },
      { lat: -26.19452, lng: 28.262698 },
    ],
  },
  {
    id: 4,
    par: 4,
    yardage: 396,
    tee: { lat: -26.194341, lng: 28.260896 },
    greenFront: { lat: -26.192814, lng: 28.263399 },
    greenCenter: { lat: -26.192742, lng: 28.263429 },
    fairwayPath: [
      { lat: -26.194341, lng: 28.260896 },
      { lat: -26.193577, lng: 28.261987 },
      { lat: -26.192814, lng: 28.263399 },
    ],
  },
  {
    id: 5,
    par: 4,
    yardage: 412,
    tee: { lat: -26.192454, lng: 28.261697 },
    greenFront: { lat: -26.190927, lng: 28.2643 },
    greenCenter: { lat: -26.190855, lng: 28.26433 },
    fairwayPath: [
      { lat: -26.192454, lng: 28.261697 },
      { lat: -26.191691, lng: 28.263199 },
      { lat: -26.190927, lng: 28.2643 },
    ],
  },
  {
    id: 6,
    par: 5,
    yardage: 527,
    tee: { lat: -26.190208, lng: 28.263899 },
    greenFront: { lat: -26.192005, lng: 28.267103 },
    greenCenter: { lat: -26.191933, lng: 28.267133 },
    fairwayPath: [
      { lat: -26.190208, lng: 28.263899 },
      { lat: -26.191107, lng: 28.265221 },
      { lat: -26.192005, lng: 28.267103 },
    ],
  },
  {
    id: 7,
    par: 3,
    yardage: 179,
    tee: { lat: -26.192364, lng: 28.267704 },
    greenFront: { lat: -26.193353, lng: 28.268805 },
    greenCenter: { lat: -26.193281, lng: 28.268835 },
    fairwayPath: [
      { lat: -26.192364, lng: 28.267704 },
      { lat: -26.192858, lng: 28.268334 },
      { lat: -26.193353, lng: 28.268805 },
    ],
  },
  {
    id: 8,
    par: 4,
    yardage: 388,
    tee: { lat: -26.193981, lng: 28.268104 },
    greenFront: { lat: -26.195778, lng: 28.266502 },
    greenCenter: { lat: -26.195706, lng: 28.266532 },
    fairwayPath: [
      { lat: -26.193981, lng: 28.268104 },
      { lat: -26.19488, lng: 28.267153 },
      { lat: -26.195778, lng: 28.266502 },
    ],
  },
  {
    id: 9,
    par: 4,
    yardage: 405,
    tee: { lat: -26.196227, lng: 28.267303 },
    greenFront: { lat: -26.197575, lng: 28.265101 },
    greenCenter: { lat: -26.197503, lng: 28.265131 },
    fairwayPath: [
      { lat: -26.196227, lng: 28.267303 },
      { lat: -26.196901, lng: 28.266352 },
      { lat: -26.197575, lng: 28.265101 },
    ],
  },
  {
    id: 10,
    par: 4,
    yardage: 371,
    tee: { lat: -26.198473, lng: 28.2641 },
    greenFront: { lat: -26.197036, lng: 28.261997 },
    greenCenter: { lat: -26.196964, lng: 28.262027 },
    fairwayPath: [
      { lat: -26.198473, lng: 28.2641 },
      { lat: -26.197754, lng: 28.262888 },
      { lat: -26.197036, lng: 28.261997 },
    ],
  },
  {
    id: 11,
    par: 5,
    yardage: 532,
    tee: { lat: -26.197844, lng: 28.261497 },
    greenFront: { lat: -26.195239, lng: 28.259795 },
    greenCenter: { lat: -26.195167, lng: 28.259825 },
    fairwayPath: [
      { lat: -26.197844, lng: 28.261497 },
      { lat: -26.196542, lng: 28.260886 },
      { lat: -26.195239, lng: 28.259795 },
    ],
  },
  {
    id: 12,
    par: 3,
    yardage: 171,
    tee: { lat: -26.195239, lng: 28.259895 },
    greenFront: { lat: -26.193981, lng: 28.260896 },
    greenCenter: { lat: -26.193909, lng: 28.260926 },
    fairwayPath: [
      { lat: -26.195239, lng: 28.259895 },
      { lat: -26.19461, lng: 28.260335 },
      { lat: -26.193981, lng: 28.260896 },
    ],
  },
  {
    id: 13,
    par: 4,
    yardage: 401,
    tee: { lat: -26.193442, lng: 28.260195 },
    greenFront: { lat: -26.191825, lng: 28.262197 },
    greenCenter: { lat: -26.191754, lng: 28.262227 },
    fairwayPath: [
      { lat: -26.193442, lng: 28.260195 },
      { lat: -26.192634, lng: 28.261386 },
      { lat: -26.191825, lng: 28.262197 },
    ],
  },
  {
    id: 14,
    par: 4,
    yardage: 422,
    tee: { lat: -26.191646, lng: 28.262298 },
    greenFront: { lat: -26.190029, lng: 28.2641 },
    greenCenter: { lat: -26.189957, lng: 28.26413 },
    fairwayPath: [
      { lat: -26.191646, lng: 28.262298 },
      { lat: -26.190837, lng: 28.263068 },
      { lat: -26.190029, lng: 28.2641 },
    ],
  },
  {
    id: 15,
    par: 5,
    yardage: 549,
    tee: { lat: -26.189669, lng: 28.2647 },
    greenFront: { lat: -26.191825, lng: 28.267503 },
    greenCenter: { lat: -26.191754, lng: 28.267533 },
    fairwayPath: [
      { lat: -26.189669, lng: 28.2647 },
      { lat: -26.190747, lng: 28.266362 },
      { lat: -26.191825, lng: 28.267503 },
    ],
  },
  {
    id: 16,
    par: 3,
    yardage: 162,
    tee: { lat: -26.191736, lng: 28.267804 },
    greenFront: { lat: -26.192814, lng: 28.268705 },
    greenCenter: { lat: -26.192742, lng: 28.268735 },
    fairwayPath: [
      { lat: -26.191736, lng: 28.267804 },
      { lat: -26.192275, lng: 28.268214 },
      { lat: -26.192814, lng: 28.268705 },
    ],
  },
  {
    id: 17,
    par: 4,
    yardage: 389,
    tee: { lat: -26.193622, lng: 28.268805 },
    greenFront: { lat: -26.195508, lng: 28.267103 },
    greenCenter: { lat: -26.195437, lng: 28.267133 },
    fairwayPath: [
      { lat: -26.193622, lng: 28.268805 },
      { lat: -26.194565, lng: 28.268094 },
      { lat: -26.195508, lng: 28.267103 },
    ],
  },
  {
    id: 18,
    par: 4,
    yardage: 417,
    tee: { lat: -26.195868, lng: 28.267904 },
    greenFront: { lat: -26.197395, lng: 28.265701 },
    greenCenter: { lat: -26.197323, lng: 28.265731 },
    fairwayPath: [
      { lat: -26.195868, lng: 28.267904 },
      { lat: -26.196631, lng: 28.266622 },
      { lat: -26.197395, lng: 28.265701 },
    ],
  },
];

const toHole = (holeCoordinates: EditableHoleCoordinates): Hole => ({
  id: holeCoordinates.id,
  name: `Hole ${holeCoordinates.id}`,
  par: holeCoordinates.par,
  yardage: holeCoordinates.yardage,
  teePosition: holeCoordinates.tee,
  fairwayPath: holeCoordinates.fairwayPath,
  green: {
    front: holeCoordinates.greenFront,
    center: holeCoordinates.greenCenter,
  },
});

const sunwardParkCenter: LatLng = { lat: -26.1947, lng: 28.2645 };

export const mockCourses: Course[] = [
  {
    id: "sunward-park-machie",
    name: "Sunward Park Machie",
    locationLabel: "Boksburg, South Africa",
    center: sunwardParkCenter,
    holes: sunwardParkMachieHoleCoordinates.map(toHole),
  },
];
