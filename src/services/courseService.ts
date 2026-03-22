import { mockCourses } from "../data/mockCourses";
import { supabase } from "../lib/supabase";
import type { Course } from "../types/golf";

export async function getCourses(): Promise<Course[]> {
  if (!supabase) {
    return mockCourses;
  }

  try {
    const { data, error } = await supabase
      .from("courses")
      .select("id,name,location_label,center_lat,center_lng,holes(*)")
      .order("id", { foreignTable: "holes", ascending: true });

    if (error || !data || data.length === 0) {
      return mockCourses;
    }

    return data.map((course: any) => ({
      id: course.id,
      name: course.name,
      locationLabel: course.location_label,
      center: {
        lat: course.center_lat,
        lng: course.center_lng,
      },
      holes: (course.holes ?? []).map((hole: any) => ({
        id: hole.id,
        name: hole.name ?? `Hole ${hole.id}`,
        par: hole.par,
        yardage: hole.yardage,
        teePosition: {
          lat: hole.tee_lat,
          lng: hole.tee_lng,
        },
        fairwayPath: hole.fairway_path,
        green: {
          front: {
            lat: hole.green_front_lat,
            lng: hole.green_front_lng,
          },
          center: {
            lat: hole.green_center_lat,
            lng: hole.green_center_lng,
          },
        },
      })),
    }));
  } catch {
    return mockCourses;
  }
}
