export interface CourseUnit {
  id: string;
  time_start: string;
  duration_mins: number;
  leader: string;
  course_types: { name: string } | null;
  rooms: { room: string; studios: { name: string; city: string | null } | null } | null;
}
