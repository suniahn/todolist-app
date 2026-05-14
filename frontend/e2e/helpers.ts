import { Page } from '@playwright/test';

export function uniqueEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

export async function register(page: Page, email: string, password: string, name: string) {
  await page.goto('/register');
  await page.fill('[name="name"]', name);
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function createTodo(
  page: Page,
  title: string,
  startDate: string,
  dueDate: string,
  categoryIndex = 0,
) {
  await page.click('text=새로운 할일 추가');
  await page.waitForURL('/todos/new');
  await page.fill('[name="title"]', title);
  await page.fill('[name="start_date"]', startDate);
  await page.fill('[name="due_date"]', dueDate);
  const categorySelect = page.locator('select[name="category_id"]');
  const options = await categorySelect.locator('option').all();
  const validOptions = options.filter((_, i) => i > 0);
  if (validOptions.length > categoryIndex) {
    const optionValue = await options[categoryIndex + 1].getAttribute('value');
    if (optionValue) await categorySelect.selectOption(optionValue);
  }
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}
