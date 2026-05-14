import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { apiClient } from '../client';
import { useAuthStore } from '../../store/authStore';

const mock = new MockAdapter(apiClient);

describe('apiClient 인터셉터', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    mock.reset();
  });

  it('accessToken이 있으면 Authorization 헤더가 자동으로 첨부된다', async () => {
    useAuthStore.getState().setTokens('test-at', 'test-rt');
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.['Authorization']).toBe('Bearer test-at');
      return [200, { ok: true }];
    });
    await apiClient.get('/test');
  });

  it('accessToken이 없으면 Authorization 헤더가 없다', async () => {
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.['Authorization']).toBeUndefined();
      return [200, { ok: true }];
    });
    await apiClient.get('/test');
  });

  it('AUTH_TOKEN_EXPIRED 응답 시 /auth/refresh를 호출하고 원본 요청을 재시도한다', async () => {
    useAuthStore.getState().setTokens('expired-at', 'valid-rt');

    const axiosMock = new MockAdapter(axios);
    axiosMock.onPost().reply(200, { accessToken: 'new-at' });

    let callCount = 0;
    mock.onGet('/protected').reply(() => {
      callCount++;
      if (callCount === 1) {
        return [401, { code: 'AUTH_TOKEN_EXPIRED', message: '인증이 만료되었습니다.' }];
      }
      return [200, { data: 'ok' }];
    });

    const res = await apiClient.get('/protected');
    expect(res.data).toEqual({ data: 'ok' });
    expect(useAuthStore.getState().accessToken).toBe('new-at');

    axiosMock.restore();
  });
});
