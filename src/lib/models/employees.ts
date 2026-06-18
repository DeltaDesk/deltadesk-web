export interface Employee {
  id: string;
  name: string;
  is_admin: boolean;
  working_time_hours: number | null;
  default_studio_name: string | null;
}
