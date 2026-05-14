import { describe, it, expect } from 'vitest';
import type {
  AuthResponse, RefreshResponse, PaginatedResponse,
  ErrorResponse, ErrorCode, TodoFilters,
  CreateTodoPayload, UpdateTodoPayload,
} from '../api';
import type { Todo } from '../domain';

describe('api types', () => {
  it('AuthResponse는 두 토큰과 user 필드를 포함한다', () => {
    const response: AuthResponse = {
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.test.sig',
      refreshToken: 'eyJhbGciOiJIUzI1NiJ9.refresh.sig',
      user: { id: 'u1', email: 'test@test.com', name: '테스트', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    };
    expect(response.accessToken).toBeTruthy();
    expect(response.refreshToken).toBeTruthy();
    expect(response.user.name).toBe('테스트');
  });

  it('PaginatedResponse는 제네릭 배열과 pagination을 포함한다', () => {
    const response: PaginatedResponse<Todo> = {
      todos: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
    expect(response.todos).toHaveLength(0);
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.limit).toBe(20);
  });

  it('ErrorCode 타입은 정의된 에러 코드 값을 가진다', () => {
    const codes: ErrorCode[] = [
      'AUTH_INVALID_CREDENTIALS',
      'AUTH_EMAIL_DUPLICATE',
      'AUTH_TOKEN_EXPIRED',
      'AUTH_UNAUTHORIZED',
      'TODO_NOT_FOUND',
      'TODO_FORBIDDEN',
      'TODO_INVALID_DATE',
      'CATEGORY_NOT_FOUND',
      'CATEGORY_IN_USE',
      'VALIDATION_ERROR',
      'INTERNAL_SERVER_ERROR',
    ];
    expect(codes).toHaveLength(11);
  });

  it('TodoFilters는 모든 필드가 선택적이다', () => {
    const emptyFilter: TodoFilters = {};
    expect(emptyFilter.category_id).toBeUndefined();
    expect(emptyFilter.is_completed).toBeUndefined();
    expect(emptyFilter.schedule_status).toBeUndefined();
  });

  it('TodoFilters schedule_status는 ongoing | overdue만 허용한다', () => {
    const overdueFilter: TodoFilters = { schedule_status: 'overdue' };
    const ongoingFilter: TodoFilters = { schedule_status: 'ongoing' };
    expect(overdueFilter.schedule_status).toBe('overdue');
    expect(ongoingFilter.schedule_status).toBe('ongoing');
  });

  it('CreateTodoPayload는 필수 필드를 포함한다', () => {
    const payload: CreateTodoPayload = {
      title: '새 할일',
      start_date: '2026-05-14',
      due_date: '2026-05-20',
      category_id: '550e8400-e29b-41d4-a716-446655440001',
    };
    expect(payload.title).toBe('새 할일');
    expect(payload.description).toBeUndefined();
  });

  it('UpdateTodoPayload는 모든 필드가 선택적이다', () => {
    const partialUpdate: UpdateTodoPayload = { title: '수정된 제목' };
    expect(partialUpdate.title).toBe('수정된 제목');
    expect(partialUpdate.due_date).toBeUndefined();
  });

  it('ErrorResponse 구조가 올바르다', () => {
    const error: ErrorResponse = {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: '이메일 또는 비밀번호가 올바르지 않습니다',
    };
    expect(error.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(error.message).toBeTruthy();
  });
});

describe('RefreshResponse type', () => {
  it('RefreshResponse는 accessToken 필드를 포함한다', () => {
    const response: RefreshResponse = {
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.new.sig',
    };
    expect(response.accessToken).toBeTruthy();
  });
});
