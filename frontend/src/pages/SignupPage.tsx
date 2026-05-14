import { SignupForm } from '../components/auth/SignupForm';

export function SignupPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          회원가입
        </h1>
        <p style={{ margin: '0 0 32px', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          계정을 만들어 할일을 관리하세요
        </p>
        <SignupForm />
      </div>
    </div>
  );
}
