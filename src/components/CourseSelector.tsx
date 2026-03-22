import type { Course } from "../types/golf";

type CourseSelectorProps = {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
};

export function CourseSelector({
  courses,
  selectedCourseId,
  onSelectCourse,
}: CourseSelectorProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      Course
      <select
        value={selectedCourseId ?? ""}
        onChange={(event) => onSelectCourse(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-sm outline-none ring-emerald-200 focus:ring-2"
      >
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>
    </label>
  );
}
