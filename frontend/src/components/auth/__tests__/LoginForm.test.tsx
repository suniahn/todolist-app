import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '../LoginForm';

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue(undefined),
    signup: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LoginForm', () => {
  it('이메일과 비밀번호 입력 필드가 렌더링된다', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('빈 폼 제출 시 유효성 에러가 표시된다', async () => {
    renderWithProviders(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument();
    });
  });

  it('잘못된 이메일 형식 입력 시 에러가 표시된다', async () => {
    renderWithProviders(<LoginForm />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument();
    });
  });

  it('회원가입 링크가 있다', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('link', { name: '회원가입' })).toBeInTheDocument();
  });
});
