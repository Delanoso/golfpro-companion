export type ErpmTee = "yellow" | "white";

export type ErpmHoleGuide = {
  holeNumber: number;
  par: 3 | 4 | 5;
  strokeIndex: number;
  distanceMeters: Record<ErpmTee, number>;
  hazards: string;
  strategy: string;
};

export type ErpmCourseGuide = {
  key: "erpm";
  displayName: string;
  location: string;
  profile: {
    established: string;
    style: string;
    windNote: string;
    ratingsByTee: {
      yellow: { rating: number; slope: number };
      white: { rating: number; slope: number };
      blue: { rating: number; slope: number };
      red: { rating: number; slope: number };
    };
  };
  holes: ErpmHoleGuide[];
};

export const ERPM_COURSE_NAME = "ERPM Golf Club";

export const ERPM_GUIDE: ErpmCourseGuide = {
  key: "erpm",
  displayName: ERPM_COURSE_NAME,
  location: "Boksburg, Gauteng",
  profile: {
    established: "Founded in 1903, established as 18 holes by 1906.",
    style:
      "Tree-lined fairways with several water hazards and strongly contoured greens that reward conservative targets.",
    windNote:
      "Boksburg afternoons can get breezy (especially Aug-Nov), so add club into wind and prioritize center-green targets on exposed holes.",
    ratingsByTee: {
      yellow: { rating: 73.9, slope: 139 },
      white: { rating: 72.0, slope: 137 },
      blue: { rating: 70.3, slope: 133 },
      red: { rating: 67.4, slope: 125 },
    },
  },
  holes: [
    {
      holeNumber: 1,
      par: 4,
      strokeIndex: 9,
      distanceMeters: { yellow: 336, white: 329 },
      hazards: "Left fairway bunker and tall pine guarding a left approach.",
      strategy:
        "Play 200m right-center with 3W/hybrid, then attack with a 120-130m wedge to remove bunker and pine from play.",
    },
    {
      holeNumber: 2,
      par: 5,
      strokeIndex: 15,
      distanceMeters: { yellow: 509, white: 485 },
      hazards: "Willow trees right and deep bunker 40m short of the green.",
      strategy:
        "Favor left off the tee, then lay up to 80-100m for a full wedge; prefer an uphill putt on this sloped green.",
    },
    {
      holeNumber: 3,
      par: 4,
      strokeIndex: 1,
      distanceMeters: { yellow: 441, white: 421 },
      hazards: "Dense left tree line can fully block green access.",
      strategy:
        "Hit driver down right side and use right-to-left ground contour; if not reaching in two, lay up right-center.",
    },
    {
      holeNumber: 4,
      par: 5,
      strokeIndex: 17,
      distanceMeters: { yellow: 541, white: 520 },
      hazards: "Strong left-to-right fairway slope, trees both sides, bunkered green.",
      strategy:
        "Start left and let slope feed center-right; do not force the green, lay up to ~90m and keep preferred uphill angle.",
    },
    {
      holeNumber: 5,
      par: 3,
      strokeIndex: 11,
      distanceMeters: { yellow: 196, white: 166 },
      hazards: "Four deep bunkers around a narrow, sloped target.",
      strategy:
        "Club up into wind and favor back-middle; shorter hitters can intentionally miss short-right apron to avoid all bunkers.",
    },
    {
      holeNumber: 6,
      par: 4,
      strokeIndex: 3,
      distanceMeters: { yellow: 432, white: 408 },
      hazards: "Dogleg left with a fairway bunker near the elbow (~230m).",
      strategy:
        "Do not cut the corner; hit 200-210m to right side (3W/5W) for a clear mid-iron angle to the green.",
    },
    {
      holeNumber: 7,
      par: 3,
      strokeIndex: 13,
      distanceMeters: { yellow: 180, white: 160 },
      hazards: "Bunkers left and front-right with a two-tier green.",
      strategy:
        "Center-green target is safest; add club for top-tier pins to carry the ridge and avoid short-siding.",
    },
    {
      holeNumber: 8,
      par: 4,
      strokeIndex: 7,
      distanceMeters: { yellow: 427, white: 379 },
      hazards: "Large dam down the entire right side of the hole.",
      strategy:
        "Commit to left-center alignment off tee and take enough club on approach to carry to the middle safely.",
    },
    {
      holeNumber: 9,
      par: 4,
      strokeIndex: 5,
      distanceMeters: { yellow: 360, white: 345 },
      hazards: "Water right and across front-right of green.",
      strategy:
        "Use controlled hybrid/iron to 190-200m, then play ~140m approach toward left-back quadrant away from water.",
    },
    {
      holeNumber: 10,
      par: 4,
      strokeIndex: 10,
      distanceMeters: { yellow: 313, white: 302 },
      hazards: "OB fence tight right and heavy bunker complex around green.",
      strategy:
        "Skip driver; hit controlled ~180m to left fairway, then full wedge to back-middle over front bunkers.",
    },
    {
      holeNumber: 11,
      par: 4,
      strokeIndex: 6,
      distanceMeters: { yellow: 399, white: 354 },
      hazards: "Narrow tree-lined chute and severe back-to-front green.",
      strategy:
        "Use your straightest tee club and favor right corridor; on approach, stay below the hole for a manageable putt.",
    },
    {
      holeNumber: 12,
      par: 3,
      strokeIndex: 12,
      distanceMeters: { yellow: 169, white: 161 },
      hazards: "Deep bunkers on both shoulders of the green.",
      strategy:
        "Front-edge yardage is ideal; short-and-straight miss keeps you on safe apron and avoids both bunkers.",
    },
    {
      holeNumber: 13,
      par: 5,
      strokeIndex: 14,
      distanceMeters: { yellow: 490, white: 470 },
      hazards: "Right-sweeping dogleg, bunker on turn, water front-left near green.",
      strategy:
        "Drive left side, then lay up right-center to 70-80m to remove front-left water from the third shot.",
    },
    {
      holeNumber: 14,
      par: 3,
      strokeIndex: 18,
      distanceMeters: { yellow: 150, white: 135 },
      hazards: "Signature carry over water to a protected green.",
      strategy:
        "Zero room short: add 5-10m of club and target center-back; long is better than wet.",
    },
    {
      holeNumber: 15,
      par: 4,
      strokeIndex: 8,
      distanceMeters: { yellow: 380, white: 360 },
      hazards: "Blind tee over hill with inside-right tree trouble.",
      strategy:
        "Pick left-center landmark over crest and commit to carry; left bias avoids getting trapped under right canopies.",
    },
    {
      holeNumber: 16,
      par: 4,
      strokeIndex: 16,
      distanceMeters: { yellow: 340, white: 320 },
      hazards: "Fairway bunkers and standard lateral trees.",
      strategy:
        "Favor fairway with 3W; avoid side bunkers and then play approach to center-green for stress-free par chance.",
    },
    {
      holeNumber: 17,
      par: 5,
      strokeIndex: 4,
      distanceMeters: { yellow: 515, white: 495 },
      hazards: "Left fairway bunker with trees that block recoveries.",
      strategy:
        "Push target line right-center off tee and on layup to keep flat stance and clean angle into green.",
    },
    {
      holeNumber: 18,
      par: 4,
      strokeIndex: 2,
      distanceMeters: { yellow: 419, white: 388 },
      hazards: "Tight dogleg right with tree canopies and heavy green bunkering.",
      strategy:
        "Aim left side of bend for maximum room; if lie is poor, lay up short of bunkers and rely on wedge + putt.",
    },
  ],
};

const normalized = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const isErpmCourseName = (value: string): boolean => {
  const cleaned = normalized(value);
  return cleaned === "erpm" || cleaned === "erpmgolfclub";
};

export const getErpmHoleGuide = (holeNumber: number): ErpmHoleGuide | undefined =>
  ERPM_GUIDE.holes.find((hole) => hole.holeNumber === holeNumber);
