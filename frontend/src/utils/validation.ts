export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function validateEmail(email: string): string | null {
  if (!email) return '이메일을 입력해주세요';
  if (!EMAIL_REGEX.test(email)) return '올바른 이메일 형식이 아닙니다';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return '비밀번호를 입력해주세요';
  if (!PASSWORD_REGEX.test(password)) return '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return '이름을 입력해주세요';
  if (name.trim().length > 50) return '이름은 50자 이하여야 합니다';
  return null;
}
