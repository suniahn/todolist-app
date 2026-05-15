import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          로그인
        </h1>
        <p style={{ margin: '0 0 32px', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          할일목록앱에 오신 것을 환영합니다
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
