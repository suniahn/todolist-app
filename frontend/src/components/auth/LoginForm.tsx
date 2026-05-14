import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validation';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '../../types/api';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = password ? null : '비밀번호를 입력해주세요';
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr ?? undefined, password: passwordErr ?? undefined });
      return;
    }
    setErrors({});
    setIsPending(true);
    try {
      await login(email, password);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      const code = axiosErr.response?.data?.code;
      if (code === 'AUTH_INVALID_CREDENTIALS') {
        setErrors({ form: '이메일 또는 비밀번호가 올바르지 않습니다' });
      } else {
        setErrors({ form: '로그인 중 오류가 발생했습니다' });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field" style={{ marginBottom: 16 }}>
        <label className="field-label" htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          className={`input${errors.email ? ' input-error' : ''}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          autoComplete="email"
          disabled={isPending}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="field" style={{ marginBottom: 24 }}>
        <label className="field-label" htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          className={`input${errors.password ? ' input-error' : ''}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력"
          autoComplete="current-password"
          disabled={isPending}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      {errors.form && (
        <p className="field-error" style={{ marginBottom: 16, textAlign: 'center' }}>
          {errors.form}
        </p>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </button>

      <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)' }}>
        계정이 없으신가요?{' '}
        <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
          회원가입
        </Link>
      </p>
    </form>
  );
}
