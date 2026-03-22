import { useEffect, useMemo, useState } from "react";
import { BottomNav, type AppTab } from "./components/BottomNav";
import { CourseSelector } from "./components/CourseSelector";
import { HoleMap } from "./components/HoleMap";
import { HoleSelector } from "./components/HoleSelector";
import { Scorecard } from "./components/Scorecard";
import { WeatherCard } from "./components/WeatherCard";
import { useGeolocation } from "./hooks/useGeolocation";
import { useWeather } from "./hooks/useWeather";
import { getCourses } from "./services/courseService";
import type { Course } from "./types/golf";
import { getDistanceMeters } from "./utils/distance";

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedHoleId, setSelectedHoleId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<AppTab>("hole");

  useEffect(() => {
    const loadCourses = async () => {
      setCoursesLoading(true);
      const loadedCourses = await getCourses();
      setCourses(loadedCourses);
      setSelectedCourseId((current) => current ?? loadedCourses[0]?.id ?? null);
      setCoursesLoading(false);
    };

    loadCourses();
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId],
  );

  useEffect(() => {
    if (!selectedCourse) return;

    const hasHole = selectedCourse.holes.some((hole) => hole.id === selectedHoleId);
    if (!hasHole) {
      setSelectedHoleId(selectedCourse.holes[0]?.id ?? 1);
    }
  }, [selectedCourse, selectedHoleId]);

  const selectedHole = useMemo(
    () => selectedCourse?.holes.find((hole) => hole.id === selectedHoleId) ?? null,
    [selectedCourse, selectedHoleId],
  );

  const { position: userPosition, error: geolocationError, isTracking } = useGeolocation();

  const distanceToFront = useMemo(() => {
    if (!userPosition || !selectedHole) return null;
    return getDistanceMeters(userPosition, selectedHole.green.front);
  }, [selectedHole, userPosition]);

  const distanceToCenter = useMemo(() => {
    if (!userPosition || !selectedHole) return null;
    return getDistanceMeters(userPosition, selectedHole.green.center);
  }, [selectedHole, userPosition]);

  const weatherLocation = selectedHole?.green.center ?? selectedCourse?.center ?? null;
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(weatherLocation);

  if (coursesLoading) {
    return <div className="p-5 text-sm text-slate-600">Loading courses...</div>;
  }

  if (!selectedCourse || !selectedHole) {
    return <div className="p-5 text-sm text-rose-600">No course data found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">GolfPro Companion</h1>
          <p className="text-sm text-slate-600">
            Mobile-first golfing companion for distances, scoring, and weather.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <CourseSelector
            courses={courses}
            selectedCourseId={selectedCourse.id}
            onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
          />
          <p className="mt-2 text-xs text-slate-500">{selectedCourse.locationLabel}</p>
        </section>

        {activeTab === "hole" && (
          <section className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <HoleSelector
                holes={selectedCourse.holes}
                selectedHoleId={selectedHoleId}
                onSelectHole={setSelectedHoleId}
              />
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Par</p>
                  <p className="text-lg font-bold">{selectedHole.par}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Yardage</p>
                  <p className="text-lg font-bold">{selectedHole.yardage} yd</p>
                </div>
              </div>
            </div>

            <HoleMap hole={selectedHole} userPosition={userPosition} />

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">To front</p>
                <p className="text-lg font-bold">{distanceToFront ? `${distanceToFront.toFixed(1)} m` : "--"}</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">To pin (center)</p>
                <p className="text-lg font-bold">{distanceToCenter ? `${distanceToCenter.toFixed(1)} m` : "--"}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 text-xs shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-600">
                GPS status: <span className="font-semibold">{isTracking ? "Tracking" : "Stopped"}</span>
              </p>
              {geolocationError && <p className="mt-1 text-rose-600">{geolocationError}</p>}
            </div>
          </section>
        )}

        {activeTab === "scorecard" && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Dynamic Scorecard</h2>
            <Scorecard holes={selectedCourse.holes} />
          </section>
        )}

        {activeTab === "weather" && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Course Weather</h2>
            <WeatherCard weather={weather} loading={weatherLoading} error={weatherError} />
          </section>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;
