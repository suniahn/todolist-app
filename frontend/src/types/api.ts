export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: import('./domain').User;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface PaginatedResponse<T> {
  todos: T[];
  pagination: { page: number; limit: number; total: number };
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
}

export type ErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_EMAIL_DUPLICATE'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'TODO_NOT_FOUND'
  | 'TODO_FORBIDDEN'
  | 'TODO_INVALID_DATE'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_IN_USE'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface TodoFilters {
  category_id?: string;
  is_completed?: boolean;
  schedule_status?: 'ongoing' | 'overdue';
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
  start_date: string;
  due_date: string;
  category_id: string;
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string | null;
  start_date?: string;
  due_date?: string;
  category_id?: string;
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}
