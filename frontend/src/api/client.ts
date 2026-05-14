import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ErrorResponse, RefreshResponse } from '../types/api';

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const config = error.config as RetryConfig | undefined;
    const data = error.response?.data as ErrorResponse | undefined;

    if (
      error.response?.status === 401 &&
      data?.code === 'AUTH_TOKEN_EXPIRED' &&
      config &&
      !config._retry
    ) {
      config._retry = true;
      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post<RefreshResponse>(
          `${import.meta.env.VITE_API_BASE_URL as string}/auth/refresh`,
          { refreshToken }
        );
        const newAt = res.data.accessToken;
        setTokens(newAt, refreshToken);
        if (config.headers) {
          config.headers.Authorization = `Bearer ${newAt}`;
        }
        return apiClient(config);
      } catch {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
