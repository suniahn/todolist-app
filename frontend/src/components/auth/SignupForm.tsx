import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateName } from '../../utils/validation';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '../../types/api';

export function SignupForm() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{
    email?: string; password?: string; name?: string; form?: string;
  }>({});
  const [isPending, setIsPending] = useState(false);

  function validate() {
    return {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      name: validateName(name) ?? undefined,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.email || errs.password || errs.name) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsPending(true);
    try {
      await signup(email, password, name);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      const code = axiosErr.response?.data?.code;
      if (code === 'AUTH_EMAIL_DUPLICATE') {
        setErrors({ email: '이미 사용 중인 이메일입니다' });
      } else {
        setErrors({ form: '회원가입 중 오류가 발생했습니다' });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field" style={{ marginBottom: 16 }}>
        <label className="field-label" htmlFor="name">이름</label>
        <input
          id="name"
          type="text"
          className={`input${errors.name ? ' input-error' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          disabled={isPending}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

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
          placeholder="8자 이상, 영문+숫자"
          autoComplete="new-password"
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
        {isPending ? '가입 중...' : '회원가입'}
      </button>

      <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)' }}>
        이미 계정이 있으신가요?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
          로그인
        </Link>
      </p>
    </form>
  );
}
