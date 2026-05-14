import { apiClient } from './client';
import type { AuthResponse, RefreshResponse, RegisterPayload, LoginPayload } from '../types/api';
import type { User } from '../types/domain';

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<User>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<void>('/auth/logout', { refreshToken }).then(() => undefined),

  refreshAccessToken: (refreshToken: string) =>
    apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),
};
