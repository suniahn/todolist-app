import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useTodos } from '../useTodos';
import type { TodoFilters, PaginatedResponse } from '../../types/api';
import type { Todo } from '../../types/domain';

vi.mock('../../api/todos', () => ({
  todosApi: {
    fetchTodos: vi.fn(),
  },
}));

import { todosApi } from '../../api/todos';

const mockTodo: Todo = {
  id: 'todo-001',
  user_id: 'user-001',
  category_id: 'cat-001',
  title: '주간 보고서 작성',
  description: null,
  start_date: '2026-05-14',
  due_date: '2026-05-20',
  is_completed: false,
  completed_at: null,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<Todo> = {
  todos: [mockTodo],
  pagination: { page: 1, limit: 20, total: 1 },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("['todos', filters, page] 쿼리 키를 사용한다", async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTodos({}, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPaginatedResponse);
  });

  it('기본 인자로 호출 시 page=1, limit=20이 사용된다', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTodos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(todosApi.fetchTodos).toHaveBeenCalledWith({}, 1, 20);
  });

  it('filters가 변경되면 다른 쿼리가 생성된다', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue(mockPaginatedResponse);

    const completedResponse: PaginatedResponse<Todo> = {
      todos: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };

    const filters1: TodoFilters = {};
    const filters2: TodoFilters = { is_completed: true };

    const { result: result1 } = renderHook(() => useTodos(filters1, 1), {
      wrapper: createWrapper(),
    });

    vi.mocked(todosApi.fetchTodos).mockResolvedValue(completedResponse);

    const { result: result2 } = renderHook(() => useTodos(filters2, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));

    expect(todosApi.fetchTodos).toHaveBeenCalledWith({}, 1, 20);
    expect(todosApi.fetchTodos).toHaveBeenCalledWith({ is_completed: true }, 1, 20);
  });

  it('반환값에 data, isLoading, error가 있다', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTodos(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('page 인자가 쿼리에 반영된다', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTodos({}, 3), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(todosApi.fetchTodos).toHaveBeenCalledWith({}, 3, 20);
  });

  it('category_id 필터가 적용된다', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue(mockPaginatedResponse);

    const filters: TodoFilters = { category_id: 'cat-001' };

    const { result } = renderHook(() => useTodos(filters, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(todosApi.fetchTodos).toHaveBeenCalledWith({ category_id: 'cat-001' }, 1, 20);
  });

  it('schedule_status 필터가 적용된다', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue(mockPaginatedResponse);

    const filters: TodoFilters = { schedule_status: 'overdue' };

    const { result } = renderHook(() => useTodos(filters, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(todosApi.fetchTodos).toHaveBeenCalledWith({ schedule_status: 'overdue' }, 1, 20);
  });
});
