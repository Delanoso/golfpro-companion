# GolfPro Companion

Modern, mobile-first golf web app built with **React + TypeScript + Tailwind**, with architecture ready for **Supabase**, live **GPS hole tracking**, dynamic **scorecard**, and **OpenWeatherMap** integration.

## Core Features

- Course database with mock starter course: **Sunward Park Machie**
- Hole-by-hole map view using **react-leaflet**
- Browser GPS tracking (Geolocation API)
- Real-time distance to:
  - Front of green
  - Center of green (pin target)
- Dynamic scorecard:
  - 9-hole and 18-hole modes
  - Strokes, putts, and par tracking
  - Auto total and score relative to par
- Weather card from OpenWeatherMap:
  - Wind speed
  - Wind direction
  - Rain probability
  - Temperature

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- react-leaflet + Leaflet
- Supabase JS client (fallback to mock data if env not set)

## Project Structure

```text
.
├── .env.example
├── index.html
├── package.json
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── BottomNav.tsx
│   │   ├── CourseSelector.tsx
│   │   ├── HoleMap.tsx
│   │   ├── HoleSelector.tsx
│   │   ├── Scorecard.tsx
│   │   └── WeatherCard.tsx
│   ├── data
│   │   └── mockCourses.ts
│   ├── hooks
│   │   ├── useGeolocation.ts
│   │   └── useWeather.ts
│   ├── index.css
│   ├── lib
│   │   └── supabase.ts
│   ├── main.tsx
│   ├── services
│   │   └── courseService.ts
│   ├── types
│   │   └── golf.ts
│   ├── utils
│   │   └── distance.ts
│   └── vite-env.d.ts
├── tsconfig.json
└── vite.config.ts
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local env file:

   ```bash
   cp .env.example .env
   ```

3. Fill in env values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENWEATHER_API_KEY`

If env values are empty, app still runs with mock course data and shows a weather API reminder.

## Run Dev Server

```bash
npm run dev -- --host
```

Use the LAN URL from terminal to open on your phone.

## Build

```bash
npm run build
```

## Mobile-first notes

- Bottom tab navigation keeps Hole View, Scorecard, and Weather easy to switch with one thumb.
- Hole selector is horizontally scrollable for quick hole changes.
- Inputs and controls are touch-friendly.
