export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  start_date: string;
  due_date: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
