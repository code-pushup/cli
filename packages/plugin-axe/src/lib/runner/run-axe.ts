import { AxeBuilder } from '@axe-core/playwright';
import ansis from 'ansis';
import type { AxeResults } from 'axe-core';
import { createRequire } from 'node:module';
import path from 'node:path';
import { type Browser, type Page, chromium } from 'playwright-core';
import type { AuditOutputs } from '@code-pushup/models';
import {
  executeProcess,
  formatAsciiTable,
  indentLines,
  logger,
  pluralizeToken,
} from '@code-pushup/utils';
import { toAuditOutputs } from './transform.js';

/* eslint-disable functional/no-let */
let browser: Browser | undefined;
let browserChecked = false;
/* eslint-enable functional/no-let */

export type AxeUrlArgs = {
  url: string;
  urlIndex: number;
  urlsCount: number;
  ruleIds: string[];
  timeout: number;
};

export type AxeUrlResult = {
  url: string;
  axeResults: AxeResults;
  auditOutputs: AuditOutputs;
};

export async function runAxeForUrl(args: AxeUrlArgs): Promise<AxeUrlResult> {
  const { url, urlIndex, urlsCount } = args;

  if (!browser) {
    await ensureBrowserInstalled();
    browser = await logger.task('Launching Chromium browser', async () => ({
      message: 'Launched Chromium browser',
      result: await chromium.launch({ headless: true }),
    }));
  }

  const prefix = ansis.gray(`[${urlIndex + 1}/${urlsCount}]`);

  return await logger.task(`${prefix} Analyzing URL ${url}`, async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const context = await browser!.newContext();

    try {
      const page = await context.newPage();
      try {
        const axeResults = await runAxeForPage(page, args);
        const auditOutputs = toAuditOutputs(axeResults, url);
        return {
          message: `${prefix} Analyzed URL ${url}`,
          result: { url, axeResults, auditOutputs },
        };
      } finally {
        await page.close();
      }
    } finally {
      await context.close();
    }
  });
}

async function runAxeForPage(
  page: Page,
  { url, ruleIds, timeout }: AxeUrlArgs,
): Promise<AxeResults> {
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

  logger.debug(
    formatAsciiTable({
      columns: ['left', 'right'],
      rows: [
        ['Passes', results.passes.length],
        ['Violations', results.violations.length],
        ['Incomplete', results.incomplete.length],
        ['Inapplicable', results.inapplicable.length],
      ],
    }),
  );

  if (results.incomplete.length > 0) {
    logger.warn(
      `Axe returned ${pluralizeToken('incomplete result', results.incomplete.length)}`,
    );
    logger.debug(
      results.incomplete
        .flatMap(res => [
          `• ${res.id}`,
          indentLines(
            res.nodes
              .flatMap(node => [...node.all, ...node.any])
              .map(check => `- ${check.message}`)
              .join('\n'),
            2,
          ),
        ])
        .join('\n'),
    );
  }

  return results;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = undefined;
    logger.debug('Closed Chromium browser');
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

  logger.debug('Checking Chromium browser installation ...');

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
