import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignupForm } from '../SignupForm';

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    signup: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
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

describe('SignupForm', () => {
  it('이름, 이메일, 비밀번호 필드가 렌더링된다', () => {
    renderWithProviders(<SignupForm />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('빈 폼 제출 시 유효성 에러가 표시된다', async () => {
    renderWithProviders(<SignupForm />);
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await waitFor(() => {
      expect(screen.getByText('이름을 입력해주세요')).toBeInTheDocument();
    });
  });

  it('7자 비밀번호 입력 시 에러가 표시된다', async () => {
    renderWithProviders(<SignupForm />);
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pass1' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await waitFor(() => {
      expect(screen.getByText(/8자 이상/)).toBeInTheDocument();
    });
  });

  it('로그인 링크가 있다', () => {
    renderWithProviders(<SignupForm />);
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
  });
});
