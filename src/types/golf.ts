export type LatLng = {
  lat: number;
  lng: number;
};

export type GreenTarget = {
  front: LatLng;
  center: LatLng;
};

export type Hole = {
  id: number;
  name: string;
  par: number;
  yardage: number;
  teePosition: LatLng;
  fairwayPath: LatLng[];
  green: GreenTarget;
};

export type Course = {
  id: string;
  name: string;
  locationLabel: string;
  center: LatLng;
  holes: Hole[];
};

export type ScorecardEntry = {
  hole: number;
  par: number;
  strokes: number;
  putts: number;
};

export type WeatherSnapshot = {
  temperatureC: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  rainProbability: number;
  description: string;
};
