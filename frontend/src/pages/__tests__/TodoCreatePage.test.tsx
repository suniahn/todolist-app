import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoCreatePage } from '../TodoCreatePage';

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
  useCreateTodo: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useToggleTodo: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TodoCreatePage', () => {
  it('헤더와 폼이 렌더링된다', () => {
    renderWithProviders(<TodoCreatePage />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
  });

  it('"새로운 할일 추가" 제목이 표시된다', () => {
    renderWithProviders(<TodoCreatePage />);

    expect(screen.getByText(/새로운 할일 추가/)).toBeInTheDocument();
  });

  it('취소 버튼이 있다', () => {
    renderWithProviders(<TodoCreatePage />);

    expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
  });
});
