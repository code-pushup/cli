import type { Page } from 'playwright-core';

export default async function setup(page: Page): Promise<void> {
  await page.goto('about:blank');
}
