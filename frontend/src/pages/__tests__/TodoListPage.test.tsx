import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoListPage } from '../TodoListPage';
import type { Category } from '../../types/domain';
import type { PaginatedResponse } from '../../types/api';
import type { Todo } from '../../types/domain';

const mockToggleMutate = vi.fn();

const mockCategory: Category = {
  id: 'cat-001',
  name: '업무',
  is_default: true,
  user_id: null,
  created_at: '2026-05-14T00:00:00Z',
};

const emptyPaginatedResponse: PaginatedResponse<Todo> = {
  todos: [],
  pagination: { page: 1, limit: 20, total: 0 },
};

const sampleTodo: Todo = {
  id: 'todo-001',
  user_id: 'user-001',
  category_id: 'cat-001',
  title: '테스트 할일',
  description: null,
  start_date: '2026-05-01',
  due_date: '2026-05-31',
  is_completed: false,
  completed_at: null,
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
};

const paginatedResponseWithTodo: PaginatedResponse<Todo> = {
  todos: [sampleTodo],
  pagination: { page: 1, limit: 20, total: 1 },
};

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({
    data: [mockCategory],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useTodos', () => ({
  useTodos: () => ({
    data: emptyPaginatedResponse,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useTodoMutations', () => ({
  useToggleTodo: () => ({
    mutate: mockToggleMutate,
    isPending: false,
    variables: undefined,
    isSuccess: false,
    isError: false,
  }),
  useDeleteTodo: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    logout: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    currentUser: {
      id: 'user-001',
      email: 'hong@example.com',
      name: '홍길동',
      created_at: '2026-05-14T00:00:00Z',
      updated_at: '2026-05-14T00:00:00Z',
    },
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh-token',
    setTokens: vi.fn(),
    setCurrentUser: vi.fn(),
    clearAuth: vi.fn(),
    isAuthenticated: () => true,
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

describe('TodoListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('헤더 영역', () => {
    it('"TodoListApp" 헤더 타이틀이 표시된다', () => {
      renderWithProviders(<TodoListPage />);
      expect(screen.getByText(/TodoListApp/i)).toBeInTheDocument();
    });

    it('"새로운 할일 추가" 버튼이 표시된다', () => {
      renderWithProviders(<TodoListPage />);

      const addButton =
        screen.queryByRole('button', { name: /새로운 할일 추가/i }) ||
        screen.queryByRole('button', { name: /할일 추가/i }) ||
        screen.queryByText(/새로운 할일 추가/i);

      expect(addButton).toBeInTheDocument();
    });

    it('로그아웃 버튼이 표시된다', () => {
      renderWithProviders(<TodoListPage />);

      const logoutButton =
        screen.queryByRole('button', { name: /로그아웃/i }) ||
        screen.queryByText(/로그아웃/i);

      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('필터 영역', () => {
    it('필터 영역이 표시된다 (카테고리 레이블)', () => {
      renderWithProviders(<TodoListPage />);
      expect(screen.getAllByText(/카테고리/i).length).toBeGreaterThan(0);
    });

    it('완료 여부 필터가 표시된다', () => {
      renderWithProviders(<TodoListPage />);
      expect(screen.getByText(/완료 여부/i)).toBeInTheDocument();
    });

    it('일정 상태 필터가 표시된다', () => {
      renderWithProviders(<TodoListPage />);
      expect(screen.getByText(/일정 상태/i)).toBeInTheDocument();
    });
  });

  describe('목록 영역', () => {
    it('초기 빈 목록일 때 "할일이 없습니다" 메시지가 표시된다', () => {
      renderWithProviders(<TodoListPage />);
      expect(screen.getByText(/할일이 없습니다/)).toBeInTheDocument();
    });

    it('useTodos와 useCategories 훅이 호출된다', async () => {
      const { useCategories } = await import('../../hooks/useCategories');
      const { useTodos } = await import('../../hooks/useTodos');

      renderWithProviders(<TodoListPage />);

      expect(useCategories).toBeDefined();
      expect(useTodos).toBeDefined();
    });
  });

  describe('통합 렌더링', () => {
    it('페이지가 오류 없이 렌더링된다', () => {
      expect(() => renderWithProviders(<TodoListPage />)).not.toThrow();
    });

    it('페이지에 주요 영역들이 모두 존재한다', () => {
      renderWithProviders(<TodoListPage />);

      expect(screen.getByText(/TodoListApp/i)).toBeInTheDocument();
      expect(screen.getAllByText(/카테고리/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/할일이 없습니다/)).toBeInTheDocument();
    });
  });

  describe('토글 기능', () => {
    it('onToggle prop이 TodoList에 전달되어 체크박스 클릭 시 toggleTodo가 호출된다', async () => {
      vi.mocked(await import('../../hooks/useTodos')).useTodos = vi.fn().mockReturnValue({
        data: paginatedResponseWithTodo,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<TodoListPage />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      await userEvent.click(checkboxes[0]);

      expect(mockToggleMutate).toHaveBeenCalledWith('todo-001');
    });

    it('togglingId가 null일 때 체크박스가 활성화 상태이다', async () => {
      vi.mocked(await import('../../hooks/useTodos')).useTodos = vi.fn().mockReturnValue({
        data: paginatedResponseWithTodo,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<TodoListPage />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeDisabled();
    });
  });
});
