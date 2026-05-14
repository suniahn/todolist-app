import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateName } from '../validation';

describe('validateEmail', () => {
  it('빈 값이면 에러를 반환한다', () => {
    expect(validateEmail('')).not.toBeNull();
  });
  it('올바른 이메일은 null을 반환한다', () => {
    expect(validateEmail('test@example.com')).toBeNull();
  });
  it('@ 없는 이메일은 에러를 반환한다', () => {
    expect(validateEmail('notanemail')).not.toBeNull();
  });
  it('도메인 없는 이메일은 에러를 반환한다', () => {
    expect(validateEmail('test@')).not.toBeNull();
  });
});

describe('validatePassword', () => {
  it('빈 값이면 에러를 반환한다', () => {
    expect(validatePassword('')).not.toBeNull();
  });
  it('8자 이상 영문+숫자 조합은 null을 반환한다', () => {
    expect(validatePassword('password1')).toBeNull();
    expect(validatePassword('abc12345')).toBeNull();
  });
  it('7자 이하면 에러를 반환한다', () => {
    expect(validatePassword('pass1')).not.toBeNull();
  });
  it('숫자 없이 영문만이면 에러를 반환한다', () => {
    expect(validatePassword('passwordonly')).not.toBeNull();
  });
  it('영문 없이 숫자만이면 에러를 반환한다', () => {
    expect(validatePassword('12345678')).not.toBeNull();
  });
});

describe('validateName', () => {
  it('빈 값이면 에러를 반환한다', () => {
    expect(validateName('')).not.toBeNull();
    expect(validateName('   ')).not.toBeNull();
  });
  it('유효한 이름은 null을 반환한다', () => {
    expect(validateName('홍길동')).toBeNull();
    expect(validateName('A')).toBeNull();
  });
  it('51자 이상이면 에러를 반환한다', () => {
    expect(validateName('a'.repeat(51))).not.toBeNull();
  });
  it('50자 이하면 null을 반환한다', () => {
    expect(validateName('a'.repeat(50))).toBeNull();
  });
});
