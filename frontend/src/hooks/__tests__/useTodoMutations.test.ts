import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ToastProvider } from '../../components/common/Toast';
import { useToggleTodo } from '../useTodoMutations';
import { todosApi } from '../../api/todos';
import type { Todo } from '../../types/domain';

vi.mock('../../api/todos', () => ({
  todosApi: {
    toggleTodo: vi.fn(),
  },
}));

const mockToggleTodo = vi.mocked(todosApi.toggleTodo);

const baseTodo: Todo = {
  id: 'todo-1',
  user_id: 'user-1',
  category_id: 'cat-1',
  title: '테스트 할일',
  description: null,
  start_date: '2026-05-01',
  due_date: '2026-05-31',
  is_completed: false,
  completed_at: null,
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ToastProvider, null, children),
      ),
    );
  };
}

describe('useToggleTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggleTodo(id) 호출 시 todosApi.toggleTodo(id)가 호출된다', async () => {
    mockToggleTodo.mockResolvedValueOnce({ ...baseTodo, is_completed: true });

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToggleTodo).toHaveBeenCalledWith('todo-1');
    expect(mockToggleTodo).toHaveBeenCalledTimes(1);
  });

  it('is_completed=true인 todo 반환 시 완료 토스트가 표시된다', async () => {
    mockToggleTodo.mockResolvedValueOnce({ ...baseTodo, is_completed: true });

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('is_completed=false인 todo 반환 시 미완료 복원 토스트가 표시된다', async () => {
    mockToggleTodo.mockResolvedValueOnce({ ...baseTodo, is_completed: false });

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('API 오류 발생 시 에러 상태가 된다', async () => {
    mockToggleTodo.mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('성공 시 todos 쿼리가 무효화된다', async () => {
    mockToggleTodo.mockResolvedValueOnce({ ...baseTodo, is_completed: true });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ToastProvider, null, children),
        ),
      );
    }

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });
});
