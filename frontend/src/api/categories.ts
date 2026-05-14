import { apiClient } from './client';
import type { Category } from '../types/domain';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../types/api';

export const categoriesApi = {
  fetchCategories: () =>
    apiClient.get<Category[]>('/categories').then((r) => r.data),

  createCategory: (payload: CreateCategoryPayload) =>
    apiClient.post<Category>('/categories', payload).then((r) => r.data),

  updateCategory: (id: string, payload: UpdateCategoryPayload) =>
    apiClient.put<Category>(`/categories/${id}`, payload).then((r) => r.data),

  deleteCategory: (id: string) =>
    apiClient.delete(`/categories/${id}`).then(() => undefined),
};
