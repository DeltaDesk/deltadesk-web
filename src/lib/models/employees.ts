import { type Studio } from "./studios";

export interface Employee {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  hours_per_week: number;
  preferred_studio: Studio | null;
}
