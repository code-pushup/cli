import { AxeBuilder } from '@axe-core/playwright';
import { createRequire } from 'node:module';
import path from 'node:path';
import { type Browser, chromium } from 'playwright-core';
import type { AuditOutputs } from '@code-pushup/models';
import {
  executeProcess,
  logger,
  pluralizeToken,
  stringifyError,
} from '@code-pushup/utils';
import { toAuditOutputs } from './transform.js';

/* eslint-disable functional/no-let */
let browser: Browser | undefined;
let browserChecked = false;
/* eslint-enable functional/no-let */

export async function runAxeForUrl(
  url: string,
  ruleIds: string[],
  timeout: number,
): Promise<AuditOutputs> {
  try {
    if (!browser) {
      await ensureBrowserInstalled();
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

/**
 * Ensures Chromium browser binary is installed before running accessibility audits.
 *
 * Uses Node's module resolution and npm's bin specification to locate playwright-core CLI,
 * working reliably with all package managers (npm, pnpm, yarn).
 */
async function ensureBrowserInstalled(): Promise<void> {
  if (browserChecked) {
    return;
  }

  logger.debug('Checking Chromium browser installation...');

  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve('playwright-core/package.json');
  const pkg = require(pkgPath);
  const cliPath = path.join(path.dirname(pkgPath), pkg.bin['playwright-core']);

  await executeProcess({
    command: 'node',
    args: [cliPath, 'install', 'chromium'],
  });

  browserChecked = true;
}
