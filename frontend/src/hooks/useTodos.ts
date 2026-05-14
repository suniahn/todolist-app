import { useQuery } from '@tanstack/react-query';
import { todosApi } from '../api/todos';
import type { TodoFilters } from '../types/api';

export function useTodos(filters: TodoFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['todos', filters, page],
    queryFn: () => todosApi.fetchTodos(filters, page, limit),
  });
}
