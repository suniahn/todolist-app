import { apiClient } from './client';
import type { Todo } from '../types/domain';
import type { CreateTodoPayload, UpdateTodoPayload, TodoFilters, PaginatedResponse } from '../types/api';

export const todosApi = {
  fetchTodos: (filters: TodoFilters = {}, page = 1, limit = 20) => {
    const params: Record<string, string | number | boolean> = { page, limit };
    if (filters.category_id !== undefined) params.category_id = filters.category_id;
    if (filters.is_completed !== undefined) params.is_completed = filters.is_completed;
    if (filters.schedule_status !== undefined) params.schedule_status = filters.schedule_status;
    return apiClient.get<PaginatedResponse<Todo>>('/todos', { params }).then((r) => r.data);
  },

  fetchTodo: (id: string) =>
    apiClient.get<Todo>(`/todos/${id}`).then((r) => r.data),

  createTodo: (payload: CreateTodoPayload) =>
    apiClient.post<Todo>('/todos', payload).then((r) => r.data),

  updateTodo: (id: string, payload: UpdateTodoPayload) =>
    apiClient.put<Todo>(`/todos/${id}`, payload).then((r) => r.data),

  deleteTodo: (id: string) =>
    apiClient.delete<void>(`/todos/${id}`).then(() => undefined),

  toggleTodo: (id: string) =>
    apiClient.patch<Todo>(`/todos/${id}/toggle`).then((r) => r.data),
};
