import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthStore } from '../../../store/authStore';

function renderProtected(isAuth: boolean) {
  if (isAuth) {
    useAuthStore.getState().setTokens('at', 'rt');
  } else {
    useAuthStore.getState().clearAuth();
  }
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('인증 상태에서 자식 컴포넌트를 렌더링한다', () => {
    renderProtected(true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('비인증 상태에서 /login으로 리다이렉트한다', () => {
    renderProtected(false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
