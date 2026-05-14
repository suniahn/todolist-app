import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../client';
import { todosApi } from '../todos';
import type { Todo } from '../../types/domain';

const mock = new MockAdapter(apiClient);

const mockTodo: Todo = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  category_id: '550e8400-e29b-41d4-a716-446655440002',
  title: '테스트 할일',
  description: null,
  start_date: '2026-05-14',
  due_date: '2026-05-20',
  is_completed: false,
  completed_at: null,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

describe('todosApi', () => {
  beforeEach(() => mock.reset());

  it('fetchTodos는 할일 목록과 pagination을 반환한다', async () => {
    mock.onGet('/todos').reply(200, {
      todos: [mockTodo],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    const result = await todosApi.fetchTodos();
    expect(result.todos).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('fetchTodos는 필터 파라미터를 쿼리스트링으로 전달한다', async () => {
    mock.onGet('/todos').reply((config) => {
      expect(config.params?.is_completed).toBe(false);
      expect(config.params?.schedule_status).toBe('overdue');
      return [200, { todos: [], pagination: { page: 1, limit: 20, total: 0 } }];
    });
    await todosApi.fetchTodos({ is_completed: false, schedule_status: 'overdue' });
  });

  it('fetchTodo는 단건 할일을 반환한다', async () => {
    mock.onGet(`/todos/${mockTodo.id}`).reply(200, mockTodo);
    const result = await todosApi.fetchTodo(mockTodo.id);
    expect(result.id).toBe(mockTodo.id);
  });

  it('createTodo는 새 할일을 생성한다', async () => {
    mock.onPost('/todos').reply(201, mockTodo);
    const result = await todosApi.createTodo({
      title: '테스트 할일',
      start_date: '2026-05-14',
      due_date: '2026-05-20',
      category_id: mockTodo.category_id,
    });
    expect(result.title).toBe('테스트 할일');
  });

  it('updateTodo는 수정된 할일을 반환한다', async () => {
    const updated = { ...mockTodo, title: '수정된 할일' };
    mock.onPut(`/todos/${mockTodo.id}`).reply(200, updated);
    const result = await todosApi.updateTodo(mockTodo.id, { title: '수정된 할일' });
    expect(result.title).toBe('수정된 할일');
  });

  it('deleteTodo는 void를 반환한다', async () => {
    mock.onDelete(`/todos/${mockTodo.id}`).reply(204);
    const result = await todosApi.deleteTodo(mockTodo.id);
    expect(result).toBeUndefined();
  });

  it('toggleTodo는 완료 상태가 토글된 할일을 반환한다', async () => {
    const toggled = { ...mockTodo, is_completed: true, completed_at: '2026-05-14T09:00:00Z' };
    mock.onPatch(`/todos/${mockTodo.id}/toggle`).reply(200, toggled);
    const result = await todosApi.toggleTodo(mockTodo.id);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).not.toBeNull();
  });
});
