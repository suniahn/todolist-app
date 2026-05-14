import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../client';
import { categoriesApi } from '../categories';
import type { Category } from '../../types/domain';

const mock = new MockAdapter(apiClient);

const defaultCategories: Category[] = [
  { id: '1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: '2', name: '개인', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: '3', name: '건강', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: '4', name: '쇼핑', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
];

describe('categoriesApi', () => {
  beforeEach(() => mock.reset());

  it('fetchCategories는 카테고리 배열을 반환한다', async () => {
    mock.onGet('/categories').reply(200, defaultCategories);
    const result = await categoriesApi.fetchCategories();
    expect(result).toHaveLength(4);
    expect(result[0].name).toBe('업무');
  });

  it('기본 카테고리의 user_id는 null이다', async () => {
    mock.onGet('/categories').reply(200, defaultCategories);
    const result = await categoriesApi.fetchCategories();
    result.forEach((cat) => expect(cat.user_id).toBeNull());
  });
});
