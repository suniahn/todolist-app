import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoList } from '../TodoList';
import type { Todo, Category } from '../../../types/domain';

const mockCategory: Category = {
  id: 'cat-001',
  name: '업무',
  is_default: true,
  user_id: null,
  created_at: '2026-05-14T00:00:00Z',
};

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

const mockTodo2: Todo = {
  ...mockTodo,
  id: 'todo-002',
  title: '코드 리뷰',
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TodoList', () => {
  describe('목록 렌더링', () => {
    it('todos가 있을 때 할일 목록이 렌더링된다', () => {
      renderWithProviders(
        <TodoList
          todos={[mockTodo, mockTodo2]}
          categories={[mockCategory]}
          isLoading={false}
          page={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getAllByText('주간 보고서 작성').length).toBeGreaterThan(0);
      expect(screen.getAllByText('코드 리뷰').length).toBeGreaterThan(0);
    });

    it('isLoading=true일 때 스켈레톤 로딩이 표시된다', () => {
      const { container } = renderWithProviders(
        <TodoList
          todos={[]}
          categories={[mockCategory]}
          isLoading={true}
          page={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const skeletonElements = container.querySelectorAll('[class*="skeleton"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('todos가 빈 배열이고 isLoading=false일 때 "할일이 없습니다" 메시지가 표시된다', () => {
      renderWithProviders(
        <TodoList
          todos={[]}
          categories={[mockCategory]}
          isLoading={false}
          page={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText('할일이 없습니다')).toBeInTheDocument();
    });

    it('카테고리 이름이 category_id로 조회되어 표시된다', () => {
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getAllByText('업무').length).toBeGreaterThan(0);
    });
  });

  describe('페이지네이션', () => {
    it('totalPages>1이면 이전/다음 버튼이 표시된다', () => {
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={2}
          totalPages={3}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByLabelText('이전 페이지')).toBeInTheDocument();
      expect(screen.getByLabelText('다음 페이지')).toBeInTheDocument();
    });

    it('page=1일 때 이전 버튼이 비활성화된다', () => {
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={1}
          totalPages={3}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByLabelText('이전 페이지')).toBeDisabled();
    });

    it('page=totalPages일 때 다음 버튼이 비활성화된다', () => {
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={3}
          totalPages={3}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByLabelText('다음 페이지')).toBeDisabled();
    });

    it('다음 버튼 클릭 시 onPageChange(page+1)이 호출된다', () => {
      const onPageChange = vi.fn();
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={2}
          totalPages={3}
          onPageChange={onPageChange}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      fireEvent.click(screen.getByLabelText('다음 페이지'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('이전 버튼 클릭 시 onPageChange(page-1)이 호출된다', () => {
      const onPageChange = vi.fn();
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={2}
          totalPages={3}
          onPageChange={onPageChange}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      fireEvent.click(screen.getByLabelText('이전 페이지'));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('totalPages=1이면 페이지네이션이 표시되지 않는다', () => {
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      expect(screen.queryByLabelText('이전 페이지')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('다음 페이지')).not.toBeInTheDocument();
    });
  });

  describe('이벤트 핸들러', () => {
    it('할일 수정 시 onEdit가 해당 id와 함께 호출된다', () => {
      const onEdit = vi.fn();
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      fireEvent.click(editButtons[0]);
      expect(onEdit).toHaveBeenCalledWith('todo-001');
    });

    it('할일 삭제 시 onDelete가 해당 id와 함께 호출된다', () => {
      const onDelete = vi.fn();
      renderWithProviders(
        <TodoList
          todos={[mockTodo]}
          categories={[mockCategory]}
          isLoading={false}
          page={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={onDelete}
          onToggle={vi.fn()}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
      fireEvent.click(deleteButtons[0]);
      expect(onDelete).toHaveBeenCalledWith('todo-001');
    });
  });
});
