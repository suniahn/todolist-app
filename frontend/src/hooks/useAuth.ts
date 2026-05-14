import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setTokens, setCurrentUser, clearAuth, refreshToken } = useAuthStore();

  async function login(email: string, password: string) {
    const data = await authApi.login({ email, password });
    setTokens(data.accessToken, data.refreshToken);
    setCurrentUser(data.user);
    navigate('/');
  }

  async function signup(email: string, password: string, name: string) {
    await authApi.register({ email, password, name });
    const data = await authApi.login({ email, password });
    setTokens(data.accessToken, data.refreshToken);
    setCurrentUser(data.user);
    navigate('/');
  }

  async function logout() {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // logout API failure is fine — clear client state anyway
      }
    }
    clearAuth();
    queryClient.clear();
    navigate('/login');
  }

  return { login, signup, logout };
}
