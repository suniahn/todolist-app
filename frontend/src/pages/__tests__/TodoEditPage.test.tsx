import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoEditPage } from '../TodoEditPage';
import type { Todo } from '../../types/domain';

const mockTodo: Todo = {
  id: 'todo-001',
  user_id: 'user-001',
  category_id: 'cat-001',
  title: '기존 할일 제목',
  description: '기존 설명',
  start_date: '2026-05-01',
  due_date: '2026-05-31',
  is_completed: false,
  completed_at: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      {
        id: 'cat-001',
        name: '업무',
        is_default: true,
        user_id: null,
        created_at: '2026-05-01T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useTodoMutations', () => ({
  useUpdateTodo: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useToggleTodo: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
}));

vi.mock('../../api/todos', () => ({
  todosApi: {
    fetchTodo: vi.fn(),
  },
}));

function renderAtRoute(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/todos/:id/edit" element={<TodoEditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TodoEditPage', () => {
  it('로딩 중 상태가 표시된다', async () => {
    const { todosApi } = await import('../../api/todos');
    vi.mocked(todosApi.fetchTodo).mockImplementation(
      () => new Promise(() => {})
    );

    renderAtRoute('/todos/todo-001/edit');

    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument();
  });

  it('데이터 로드 후 폼이 렌더링된다', async () => {
    const { todosApi } = await import('../../api/todos');
    vi.mocked(todosApi.fetchTodo).mockResolvedValue(mockTodo);

    renderAtRoute('/todos/todo-001/edit');

    const form = await screen.findByLabelText(/제목/);
    expect(form).toBeInTheDocument();
  });

  it('기존 title이 input에 미리 채워진다', async () => {
    const { todosApi } = await import('../../api/todos');
    vi.mocked(todosApi.fetchTodo).mockResolvedValue(mockTodo);

    renderAtRoute('/todos/todo-001/edit');

    const titleInput = await screen.findByDisplayValue('기존 할일 제목');
    expect(titleInput).toBeInTheDocument();
  });
});
