import type { Page } from 'playwright-core';

export async function setup(page: Page): Promise<void> {
  await page.goto('about:blank');
}
