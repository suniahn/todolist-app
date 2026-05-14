import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useCategories } from '../useCategories';
import type { Category } from '../../types/domain';

vi.mock('../../api/categories', () => ({
  categoriesApi: {
    fetchCategories: vi.fn(),
  },
}));

import { categoriesApi } from '../../api/categories';

const mockCategories: Category[] = [
  { id: 'cat-001', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-002', name: '개인', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("['categories'] 쿼리 키로 카테고리 목록을 불러온다", async () => {
    vi.mocked(categoriesApi.fetchCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
  });

  it('categoriesApi.fetchCategories를 호출한다', async () => {
    vi.mocked(categoriesApi.fetchCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.fetchCategories).toHaveBeenCalledTimes(1);
  });

  it('반환값에 data, isLoading, error가 있다', async () => {
    vi.mocked(categoriesApi.fetchCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('초기 상태에서 isLoading이 true이다', () => {
    vi.mocked(categoriesApi.fetchCategories).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('API 오류 시 error가 설정된다', async () => {
    const errorMessage = '네트워크 오류';
    vi.mocked(categoriesApi.fetchCategories).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('카테고리 목록이 올바른 개수로 반환된다', async () => {
    vi.mocked(categoriesApi.fetchCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
  });
});
