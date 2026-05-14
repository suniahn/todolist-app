import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoFilter } from '../TodoFilter';
import type { Category } from '../../../types/domain';
import type { TodoFilters } from '../../../types/api';

const mockCategories: Category[] = [
  { id: 'cat-001', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-002', name: '개인', is_default: false, user_id: 'user-001', created_at: '2026-05-14T00:00:00Z' },
];

const defaultFilters: TodoFilters = {};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function getCategorySelect(container: HTMLElement): HTMLSelectElement {
  const labels = Array.from(container.querySelectorAll('label.field-label'));
  const categoryLabel = labels.find((l) => l.textContent === '카테고리');
  const field = categoryLabel?.closest('.field');
  return field?.querySelector('select') as HTMLSelectElement;
}

function getCompletedSelect(container: HTMLElement): HTMLSelectElement {
  const labels = Array.from(container.querySelectorAll('label.field-label'));
  const completedLabel = labels.find((l) => l.textContent === '완료 여부');
  const field = completedLabel?.closest('.field');
  return field?.querySelector('select') as HTMLSelectElement;
}

describe('TodoFilter', () => {
  describe('카테고리 필터', () => {
    it('카테고리 드롭다운이 렌더링된다', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );
      expect(screen.getByText('카테고리')).toBeInTheDocument();
    });

    it('"전체" 옵션이 기본으로 있다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const select = getCategorySelect(container);
      const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
      expect(options).toContain('');

      const allOptionText = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
      expect(allOptionText).toContain('전체');
    });

    it('카테고리 목록이 드롭다운에 표시된다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const select = getCategorySelect(container);
      const optionTexts = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
      expect(optionTexts).toContain('업무');
      expect(optionTexts).toContain('개인');
    });

    it('카테고리 선택 시 onChange가 category_id와 함께 호출된다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const select = getCategorySelect(container);
      fireEvent.change(select, { target: { value: 'cat-001' } });

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ category_id: 'cat-001' }));
    });

    it('카테고리 "전체" 선택 시 onChange가 category_id=undefined로 호출된다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter
          filters={{ category_id: 'cat-001' }}
          categories={mockCategories}
          onChange={onChange}
        />
      );

      const select = getCategorySelect(container);
      fireEvent.change(select, { target: { value: '' } });

      const call = onChange.mock.calls[0][0] as TodoFilters;
      expect(call.category_id).toBeUndefined();
    });
  });

  describe('완료 여부 필터', () => {
    it('완료 여부 드롭다운이 렌더링된다', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );
      expect(screen.getByText('완료 여부')).toBeInTheDocument();
    });

    it('"전체", "미완료만", "완료만" 옵션이 있다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const select = getCompletedSelect(container);
      const optionTexts = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
      expect(optionTexts).toContain('전체');
      expect(optionTexts).toContain('미완료만');
      expect(optionTexts).toContain('완료만');
    });

    it('"미완료만" 선택 시 onChange가 is_completed=false로 호출된다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const select = getCompletedSelect(container);
      fireEvent.change(select, { target: { value: 'false' } });

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ is_completed: false }));
    });

    it('"완료만" 선택 시 onChange가 is_completed=true로 호출된다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const select = getCompletedSelect(container);
      fireEvent.change(select, { target: { value: 'true' } });

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }));
    });

    it('"전체" 선택 시 onChange가 is_completed=undefined로 호출된다', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <TodoFilter
          filters={{ is_completed: true }}
          categories={mockCategories}
          onChange={onChange}
        />
      );

      const select = getCompletedSelect(container);
      fireEvent.change(select, { target: { value: '' } });

      const call = onChange.mock.calls[0][0] as TodoFilters;
      expect(call.is_completed).toBeUndefined();
    });
  });

  describe('일정 상태 필터', () => {
    it('일정 상태 라디오버튼이 있다', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );
      expect(screen.getByText('일정 상태')).toBeInTheDocument();
    });

    it('"전체", "진행 중", "기간초과" 라디오 옵션이 있다', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const radios = screen.getAllByRole('radio');
      const values = radios.map((r) => (r as HTMLInputElement).value);
      expect(values).toContain('');
      expect(values).toContain('ongoing');
      expect(values).toContain('overdue');
    });

    it('"기간초과" 라디오 선택 시 onChange가 schedule_status="overdue"로 호출된다', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const radios = screen.getAllByRole('radio');
      const overdueRadio = radios.find((r) => (r as HTMLInputElement).value === 'overdue');
      fireEvent.click(overdueRadio!);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ schedule_status: 'overdue' })
      );
    });

    it('"전체" 라디오 선택 시 onChange가 schedule_status=undefined로 호출된다', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TodoFilter
          filters={{ schedule_status: 'overdue' }}
          categories={mockCategories}
          onChange={onChange}
        />
      );

      const radios = screen.getAllByRole('radio');
      const allRadio = radios.find((r) => (r as HTMLInputElement).value === '');
      fireEvent.click(allRadio!);

      const call = onChange.mock.calls[0][0] as TodoFilters;
      expect(call.schedule_status).toBeUndefined();
    });

    it('"진행 중" 라디오 선택 시 onChange가 schedule_status="ongoing"으로 호출된다', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TodoFilter filters={defaultFilters} categories={mockCategories} onChange={onChange} />
      );

      const radios = screen.getAllByRole('radio');
      const ongoingRadio = radios.find((r) => (r as HTMLInputElement).value === 'ongoing');
      fireEvent.click(ongoingRadio!);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ schedule_status: 'ongoing' })
      );
    });
  });
});
