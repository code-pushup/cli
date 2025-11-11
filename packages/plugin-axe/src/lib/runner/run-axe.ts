import AxeBuilder from '@axe-core/playwright';
import { type Browser, chromium } from 'playwright-core';
import type { AuditOutputs } from '@code-pushup/models';
import { logger, pluralizeToken, stringifyError } from '@code-pushup/utils';
import { toAuditOutputs } from './transform.js';

let browser: Browser | undefined;

export async function runAxeForUrl(
  url: string,
  ruleIds: string[],
  timeout: number,
): Promise<AuditOutputs> {
  try {
    if (!browser) {
      logger.debug('Launching Chromium browser...');
      browser = await chromium.launch({ headless: true });
    }

    const context = await browser.newContext();

    try {
      const page = await context.newPage();
      try {
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout,
        });

        const axeBuilder = new AxeBuilder({ page });

        // Use withRules() to include experimental/deprecated rules
        if (ruleIds.length > 0) {
          axeBuilder.withRules(ruleIds);
        }

        const results = await axeBuilder.analyze();

        const incompleteCount = results.incomplete.length;

        if (incompleteCount > 0) {
          logger.warn(
            `Axe returned ${pluralizeToken('incomplete result', incompleteCount)} for ${url}`,
          );
        }

        return toAuditOutputs(results, url);
      } finally {
        await page.close();
      }
    } finally {
      await context.close();
    }
  } catch (error) {
    logger.error(`Axe execution failed for ${url}: ${stringifyError(error)}`);
    throw error;
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = undefined;
  }
}
