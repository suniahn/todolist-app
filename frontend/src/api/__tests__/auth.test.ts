import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../client';
import { authApi } from '../auth';
import type { User } from '../../types/domain';

const mock = new MockAdapter(apiClient);

const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

describe('authApi', () => {
  beforeEach(() => mock.reset());

  it('register는 User를 반환한다', async () => {
    mock.onPost('/auth/register').reply(201, mockUser);
    const result = await authApi.register({ email: 'test@example.com', password: 'password1', name: '홍길동' });
    expect(result.email).toBe('test@example.com');
    expect(result).not.toHaveProperty('password');
  });

  it('login은 accessToken과 refreshToken을 반환한다', async () => {
    mock.onPost('/auth/login').reply(200, { accessToken: 'at', refreshToken: 'rt' });
    const result = await authApi.login({ email: 'test@example.com', password: 'password1' });
    expect(result.accessToken).toBe('at');
    expect(result.refreshToken).toBe('rt');
  });

  it('logout은 void를 반환한다', async () => {
    mock.onPost('/auth/logout').reply(200, {});
    const result = await authApi.logout('rt');
    expect(result).toBeUndefined();
  });

  it('refreshAccessToken은 새 accessToken을 반환한다', async () => {
    mock.onPost('/auth/refresh').reply(200, { accessToken: 'new-at' });
    const result = await authApi.refreshAccessToken('rt');
    expect(result.accessToken).toBe('new-at');
  });
});
