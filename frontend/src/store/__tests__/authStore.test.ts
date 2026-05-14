import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

const AT = 'access.token.value';
const RT = 'refresh.token.value';
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('초기 상태는 모두 null이다', () => {
    const { accessToken, refreshToken, currentUser } = useAuthStore.getState();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
    expect(currentUser).toBeNull();
  });

  it('setTokens로 토큰이 저장된다', () => {
    useAuthStore.getState().setTokens(AT, RT);
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe(AT);
    expect(refreshToken).toBe(RT);
  });

  it('setCurrentUser로 사용자 정보가 저장된다', () => {
    useAuthStore.getState().setCurrentUser(mockUser);
    expect(useAuthStore.getState().currentUser).toEqual(mockUser);
  });

  it('isAuthenticated는 accessToken이 있을 때 true를 반환한다', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    useAuthStore.getState().setTokens(AT, RT);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('clearAuth로 모든 상태가 초기화된다', () => {
    useAuthStore.getState().setTokens(AT, RT);
    useAuthStore.getState().setCurrentUser(mockUser);
    useAuthStore.getState().clearAuth();
    const { accessToken, refreshToken, currentUser } = useAuthStore.getState();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
    expect(currentUser).toBeNull();
  });

  it('isAuthenticated는 clearAuth 후 false를 반환한다', () => {
    useAuthStore.getState().setTokens(AT, RT);
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('localStorage에 토큰이 저장되지 않는다', () => {
    useAuthStore.getState().setTokens(AT, RT);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
