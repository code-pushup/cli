import { AxeBuilder } from '@axe-core/playwright';
import ansis from 'ansis';
import type { AxeResults } from 'axe-core';
import { createRequire } from 'node:module';
import path from 'node:path';
import {
  type Browser,
  type BrowserContextOptions,
  type Page,
  chromium,
} from 'playwright-core';
import type { AuditOutputs } from '@code-pushup/models';
import {
  executeProcess,
  formatAsciiTable,
  indentLines,
  logger,
  pluralizeToken,
} from '@code-pushup/utils';
import { type SetupFunction, runSetup } from './setup.js';
import { createUrlSuffix, toAuditOutputs } from './transform.js';

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

/**
 * Manages Playwright browser lifecycle and runs Axe accessibility audits.
 * Handles browser installation, authentication state, and URL analysis.
 */
export class AxeRunner {
  private browser: Browser | undefined;
  private browserInstalled = false;
  private storageState: BrowserContextOptions['storageState'];

  /** Analyzes a URL for accessibility issues using Axe. */
  async analyzeUrl(args: AxeUrlArgs): Promise<AxeUrlResult> {
    const browser = await this.launchBrowser();
    const { url, urlIndex, urlsCount } = args;
    const prefix = ansis.gray(`[${urlIndex + 1}/${urlsCount}]`);

    return await logger.task(`${prefix} Analyzing URL ${url}`, async () => {
      const context = await browser.newContext({
        ...(this.storageState && { storageState: this.storageState }),
      });

      try {
        const page = await context.newPage();
        try {
          const axeResults = await analyzePage(page, args);
          const auditOutputs = toAuditOutputs(
            axeResults,
            createUrlSuffix(url, urlsCount),
          );
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

  /** Runs setup script and captures authentication state for reuse. */
  async captureAuthState(
    setupFn: SetupFunction,
    timeout: number,
  ): Promise<void> {
    const browser = await this.launchBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      page.setDefaultTimeout(timeout);
      await runSetup(setupFn, page);
      this.storageState = await context.storageState();
      logger.debug('Captured authentication state from setup script');
    } finally {
      await page.close();
      await context.close();
      logger.debug('Closed setup context');
    }
  }

  /** Closes the browser and clears authentication state. */
  async close(): Promise<void> {
    this.storageState = undefined;
    this.browserInstalled = false;

    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      logger.debug('Closed Chromium browser');
    }
  }

  /**
   * Ensures Chromium browser binary is installed before running accessibility audits.
   *
   * Uses Node's module resolution and npm's bin specification to locate playwright-core CLI,
   * working reliably with all package managers (npm, pnpm, yarn).
   */
  private async installBrowser(): Promise<void> {
    if (this.browserInstalled) {
      return;
    }

    logger.debug('Checking Chromium browser installation ...');

    const require = createRequire(import.meta.url);
    const pkgPath = require.resolve('playwright-core/package.json');
    const pkg = require(pkgPath);
    const cliPath = path.join(
      path.dirname(pkgPath),
      pkg.bin['playwright-core'],
    );

    await executeProcess({
      command: 'node',
      args: [cliPath, 'install', 'chromium'],
    });

    this.browserInstalled = true;
  }

  /** Lazily launches or returns existing Chromium browser instance. */
  private async launchBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    await this.installBrowser();

    this.browser = await logger.task(
      'Launching Chromium browser',
      async () => ({
        message: 'Launched Chromium browser',
        result: await chromium.launch({ headless: true }),
      }),
    );

    return this.browser;
  }
}

async function analyzePage(
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
