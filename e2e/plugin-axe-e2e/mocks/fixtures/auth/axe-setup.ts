import type { Page } from 'playwright-core';

export default async function setup(page: Page): Promise<void> {
  await page.goto('http://localhost:8080/login');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'testpass');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}
