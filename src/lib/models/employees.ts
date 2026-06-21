export interface Employee {
  id: string;
  name: string;
  is_admin: boolean;
  working_time: string | null;
  working_time_hours: number | null;
  default_studio_name: string | null;
}

export interface WorkingTimeOption {
  id: string;
  name: string;
  hours_per_week: number;
}
