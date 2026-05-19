export type UserRole = "student" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithStats extends User {
  items_count: number;
  reports_count: number;
}
