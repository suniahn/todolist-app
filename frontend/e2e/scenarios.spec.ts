import { test, expect } from '@playwright/test';
import { uniqueEmail, register, createTodo } from './helpers';

const TODAY = new Date().toISOString().split('T')[0];
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const DEFAULT_PASSWORD = 'Password1';

// SCN-01: 회원가입 → 자동로그인 → todo 생성 전체 흐름
test('SCN-01: 회원가입 후 자동로그인, todo 생성', async ({ page }) => {
  const email = uniqueEmail();

  await page.goto('/register');
  await page.fill('[name="name"]', '테스트유저');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', DEFAULT_PASSWORD);
  await page.click('button[type="submit"]');

  // 회원가입 후 자동으로 메인 페이지로 이동
  await page.waitForURL('/');
  await expect(page.locator('text=테스트유저님')).toBeVisible();

  // todo 생성
  await createTodo(page, 'SCN-01 테스트 할일', TODAY, TOMORROW);

  // 목록에 나타나는지 확인
  await expect(page.locator('text=SCN-01 테스트 할일')).toBeVisible();
});

// SCN-02: 잘못된 비밀번호 → 오류 메시지 → 재입력 성공
test('SCN-02: 잘못된 비밀번호 로그인 오류 후 성공', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '오류테스트');

  await page.locator('button.btn-ghost').filter({ hasText: '로그아웃' }).click();
  await page.waitForURL('/login');

  // 잘못된 비밀번호로 로그인 시도
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', 'WrongPass1');
  await page.click('button[type="submit"]');

  // 에러 메시지 표시
  await expect(page.locator('[role="alert"], .text-error, [class*="error"]').first()).toBeVisible({ timeout: 5000 });

  // 올바른 비밀번호로 재시도
  await page.fill('[name="password"]', DEFAULT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
});

// SCN-03: due_date < start_date → 실시간 경고 → 수정 후 제출 성공
test('SCN-03: 날짜 유효성 실시간 검사', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '날짜테스트');

  await page.click('text=새로운 할일 추가');
  await page.waitForURL('/todos/new');

  await page.fill('[name="title"]', 'SCN-03 날짜 테스트');
  await page.fill('[name="start_date"]', TOMORROW);
  await page.fill('[name="due_date"]', TODAY); // 종료일 < 시작일

  // 실시간 경고 표시
  await expect(page.locator('text=종료예정일은 시작일보다 이전일 수 없습니다')).toBeVisible();

  // submit 버튼이 비활성화
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeDisabled();

  // 올바른 날짜로 수정
  await page.fill('[name="due_date"]', TOMORROW);
  await expect(page.locator('text=종료예정일은 시작일보다 이전일 수 없습니다')).not.toBeVisible();
  await expect(submitBtn).not.toBeDisabled();

  // 카테고리 선택 후 제출
  const categorySelect = page.locator('select[name="category_id"]');
  const options = await categorySelect.locator('option').all();
  if (options.length > 1) {
    const val = await options[1].getAttribute('value');
    if (val) await categorySelect.selectOption(val);
  }
  await submitBtn.click();
  await page.waitForURL('/');
  await expect(page.locator('text=SCN-03 날짜 테스트')).toBeVisible();
});

// SCN-04: 카테고리 + 기간초과 필터 복합 적용
test('SCN-04: 카테고리 + 기간초과 필터 복합 적용', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '필터테스트');

  // 기간 초과 todo 생성 (is_completed=false, due_date < today)
  await page.click('text=새로운 할일 추가');
  await page.waitForURL('/todos/new');
  await page.fill('[name="title"]', '기간초과 테스트');
  await page.fill('[name="start_date"]', YESTERDAY);
  await page.fill('[name="due_date"]', YESTERDAY);
  const categorySelect = page.locator('select[name="category_id"]');
  const options = await categorySelect.locator('option').all();
  if (options.length > 1) {
    const firstCategoryValue = await options[1].getAttribute('value') ?? '';
    await categorySelect.selectOption(firstCategoryValue);
  }
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // 기간초과 필터 적용
  const scheduleFilter = page.locator('[name="schedule_status"]').or(
    page.locator('input[value="overdue"]')
  );
  if (await scheduleFilter.count() > 0) {
    await scheduleFilter.first().click();
  }

  // 기간초과 todo가 보여야 함
  await expect(page.locator('text=기간초과 테스트')).toBeVisible();
});

// SCN-05: todo 완료 토글 → 취소선 표시 → 재토글 복원
test('SCN-05: todo 완료 토글 및 복원', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '토글테스트');
  await createTodo(page, 'SCN-05 토글 테스트', TODAY, TOMORROW);

  // 체크박스 클릭 (완료로 변경)
  const checkbox = page.locator('input[type="checkbox"]').first();
  await checkbox.click();
  await page.waitForTimeout(500);

  // 취소선 CSS 클래스 확인 (todo-completed)
  await expect(page.locator('.todo-completed, [class*="line-through"]').first()).toBeVisible({ timeout: 5000 });

  // 재토글 (미완료로 복원)
  await checkbox.click();
  await page.waitForTimeout(500);
  await expect(page.locator('.todo-completed, [class*="line-through"]').first()).not.toBeVisible({ timeout: 5000 });
});

// SCN-06: todo 수정 → 카테고리 변경 → 저장
test('SCN-06: todo 수정 및 카테고리 변경', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '수정테스트');
  await createTodo(page, 'SCN-06 수정 전', TODAY, TOMORROW, 0);

  // 수정 버튼 클릭
  await page.locator('button').filter({ hasText: '수정' }).first().click();
  await page.waitForURL(/\/todos\/.+\/edit/);

  // 제목 수정
  const titleInput = page.locator('[name="title"]');
  await titleInput.fill('SCN-06 수정 후');

  // 카테고리 변경 (두 번째 옵션으로)
  const categorySelect = page.locator('select[name="category_id"]');
  const options = await categorySelect.locator('option').all();
  if (options.length > 2) {
    const val = await options[2].getAttribute('value');
    if (val) await categorySelect.selectOption(val);
  }

  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // 수정된 제목이 목록에 나타나는지 확인
  await expect(page.locator('text=SCN-06 수정 후')).toBeVisible();
  await expect(page.locator('text=SCN-06 수정 전')).not.toBeVisible();
});

// SCN-07: 삭제 확인 모달 → 삭제 실행 → 목록에서 제거
test('SCN-07: 삭제 확인 모달 및 삭제', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '삭제테스트');
  await createTodo(page, 'SCN-07 삭제 대상', TODAY, TOMORROW);

  // 목록에 있는지 확인
  await expect(page.locator('text=SCN-07 삭제 대상')).toBeVisible();

  // 삭제 버튼 클릭
  await page.locator('button').filter({ hasText: '삭제' }).first().click();

  // 확인 모달 표시
  await expect(page.locator('text=정말로 삭제하시겠습니까?')).toBeVisible();

  // 삭제 확인
  await page.locator('button').filter({ hasText: '삭제' }).last().click();

  // 목록에서 제거 확인
  await expect(page.locator('text=SCN-07 삭제 대상')).not.toBeVisible({ timeout: 5000 });
});

// SCN-10: 로그아웃 → /login 리다이렉트 → / 직접 접근 차단
test('SCN-10: 로그아웃 및 보호 라우트', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '로그아웃테스트');

  // 로그아웃
  await page.locator('button.btn-ghost').filter({ hasText: '로그아웃' }).click();
  await page.waitForURL('/login');

  // / 직접 접근 시 /login으로 리다이렉트
  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

// 반응형: 1024px 이상 테이블 뷰, 미만 카드 뷰
test('반응형: 데스크톱(1280px) 테이블 뷰', async ({ page }) => {
  const email = uniqueEmail();
  await page.setViewportSize({ width: 1280, height: 800 });
  await register(page, email, DEFAULT_PASSWORD, '반응형테스트');
  await createTodo(page, '반응형 테스트 할일', TODAY, TOMORROW);

  // 테이블이 보여야 함 (hidden desktop:block)
  await expect(page.locator('table')).toBeVisible();
  // 모바일 카드 컨테이너는 숨겨져 있어야 함
  const mobileCards = page.locator('.desktop\\:hidden').first();
  await expect(mobileCards).toBeHidden();
});

test('반응형: 모바일(768px) 카드 뷰', async ({ page }) => {
  const email = uniqueEmail();
  await page.setViewportSize({ width: 768, height: 900 });
  await register(page, email, DEFAULT_PASSWORD, '모바일테스트');
  await createTodo(page, '모바일 카드 테스트', TODAY, TOMORROW);

  // 테이블은 숨겨져 있어야 함
  const desktopTable = page.locator('.hidden.desktop\\:block').first();
  await expect(desktopTable).toBeHidden();
});

// 콘솔 에러 없음 확인
test('콘솔 에러 없음', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const email = uniqueEmail();
  await register(page, email, DEFAULT_PASSWORD, '에러확인');
  await createTodo(page, '에러 없음 테스트', TODAY, TOMORROW);

  // 로그인 관련 에러나 인증 에러 필터링 후 확인
  const criticalErrors = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('net::ERR_')
  );
  expect(criticalErrors).toHaveLength(0);
});
