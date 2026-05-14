import { describe, it, expect } from 'vitest';
import type { User, Category, Todo } from '../domain';

describe('domain types', () => {
  it('User 타입은 필수 필드를 포함한다', () => {
    const user: User = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      name: '홍길동',
      created_at: '2026-05-14T00:00:00Z',
      updated_at: '2026-05-14T00:00:00Z',
    };
    expect(user.id).toBeTruthy();
    expect(user.email).toContain('@');
  });

  it('Category user_id는 null을 허용한다', () => {
    const defaultCategory: Category = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: '업무',
      is_default: true,
      user_id: null,
      created_at: '2026-05-14T00:00:00Z',
    };
    expect(defaultCategory.user_id).toBeNull();
    expect(defaultCategory.is_default).toBe(true);
  });

  it('Todo completed_at은 null을 허용한다', () => {
    const todo: Todo = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      category_id: '550e8400-e29b-41d4-a716-446655440001',
      title: '테스트 할일',
      description: null,
      start_date: '2026-05-14',
      due_date: '2026-05-20',
      is_completed: false,
      completed_at: null,
      created_at: '2026-05-14T00:00:00Z',
      updated_at: '2026-05-14T00:00:00Z',
    };
    expect(todo.completed_at).toBeNull();
    expect(todo.is_completed).toBe(false);
  });

  it('Todo 완료 상태에서 completed_at이 설정된다', () => {
    const completedTodo: Todo = {
      id: '550e8400-e29b-41d4-a716-446655440003',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      category_id: '550e8400-e29b-41d4-a716-446655440001',
      title: '완료된 할일',
      description: '설명',
      start_date: '2026-05-01',
      due_date: '2026-05-10',
      is_completed: true,
      completed_at: '2026-05-10T09:00:00Z',
      created_at: '2026-05-01T00:00:00Z',
      updated_at: '2026-05-10T09:00:00Z',
    };
    expect(completedTodo.is_completed).toBe(true);
    expect(completedTodo.completed_at).not.toBeNull();
  });
});
