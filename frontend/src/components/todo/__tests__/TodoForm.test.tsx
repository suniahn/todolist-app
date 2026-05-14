import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoForm } from '../TodoForm';
import type { Category } from '../../../types/domain';

const mockCategories: Category[] = [
  {
    id: 'cat-001',
    name: '업무',
    is_default: true,
    user_id: null,
    created_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'cat-002',
    name: '개인',
    is_default: false,
    user_id: 'user-001',
    created_at: '2026-05-01T00:00:00Z',
  },
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TodoForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모든 필드(제목, 설명, 시작일, 종료예정일, 카테고리)가 렌더링된다', () => {
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
    expect(screen.getByLabelText(/설명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/시작일/)).toBeInTheDocument();
    expect(screen.getByLabelText(/종료예정일/)).toBeInTheDocument();
    expect(screen.getByLabelText(/카테고리/)).toBeInTheDocument();
  });

  it('제목이 비어있으면 제출 버튼이 비활성화된다', () => {
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /등록/ });
    expect(submitButton).toBeDisabled();
  });

  it('제목을 입력하면 카운터가 갱신된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/제목/);
    await user.type(titleInput, 'hello');

    expect(screen.getByText(/5 \/ 200/)).toBeInTheDocument();
  });

  it('category_id 없으면 제출 버튼 비활성화', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/제목/);
    await user.type(titleInput, '테스트 제목');

    const submitButton = screen.getByRole('button', { name: /등록/ });
    expect(submitButton).toBeDisabled();
  });

  it('due_date < start_date 입력 시 경고 메시지 표시 + 제출 불가', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/제목/);
    await user.type(titleInput, '테스트 제목');

    const startDateInput = screen.getByLabelText(/시작일/);
    await user.type(startDateInput, '2026-05-20');

    const dueDateInput = screen.getByLabelText(/종료예정일/);
    await user.type(dueDateInput, '2026-05-10');

    expect(screen.getByText(/종료예정일은 시작일보다 이전일 수 없습니다/)).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: /등록/ });
    expect(submitButton).toBeDisabled();
  });

  it('due_date >= start_date 이면 경고 없음', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    const startDateInput = screen.getByLabelText(/시작일/);
    await user.type(startDateInput, '2026-05-10');

    const dueDateInput = screen.getByLabelText(/종료예정일/);
    await user.type(dueDateInput, '2026-05-20');

    expect(screen.queryByText(/종료예정일은 시작일보다 이전일 수 없습니다/)).not.toBeInTheDocument();
  });

  it('유효한 값 입력 시 제출 버튼 활성화', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    await user.type(screen.getByLabelText(/제목/), '테스트 제목');
    await user.type(screen.getByLabelText(/시작일/), '2026-05-10');
    await user.type(screen.getByLabelText(/종료예정일/), '2026-05-20');
    await user.selectOptions(screen.getByLabelText(/카테고리/), 'cat-001');

    const submitButton = screen.getByRole('button', { name: /등록/ });
    expect(submitButton).not.toBeDisabled();
  });

  it('제출 시 onSubmit이 올바른 payload로 호출된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    await user.type(screen.getByLabelText(/제목/), '테스트 제목');
    await user.type(screen.getByLabelText(/시작일/), '2026-05-10');
    await user.type(screen.getByLabelText(/종료예정일/), '2026-05-20');
    await user.selectOptions(screen.getByLabelText(/카테고리/), 'cat-001');

    const submitButton = screen.getByRole('button', { name: /등록/ });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: '테스트 제목',
      description: undefined,
      start_date: '2026-05-10',
      due_date: '2026-05-20',
      category_id: 'cat-001',
    });
  });

  it('isPending=true 시 제출 버튼 비활성화', () => {
    renderWithProviders(
      <TodoForm
        initialValues={{
          title: '테스트',
          start_date: '2026-05-10',
          due_date: '2026-05-20',
          category_id: 'cat-001',
        }}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={true}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /등록/ });
    expect(submitButton).toBeDisabled();
  });

  it('취소 버튼 클릭 시 onCancel 호출', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TodoForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        isPending={false}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /취소/ });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
