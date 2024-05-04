import type { ReporterOptions } from 'knip';
import { writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ensureDirectoryExists, ui } from '@code-pushup/utils';
import { KNIP_REPORT_NAME } from '../constants';
import { parseCustomReporterOptions } from './model';
import { DeepPartial } from './types';
import { knipToCpReport } from './utils';

/**
 * @example
 *
 * npx knip --reporter ./code-pushup.reporter.ts --reporter-options='{\"outputFile\":\"my-knip-report.json\"}'
 *
 */
export const knipReporter = async ({
  report,
  issues,
  options,
}: DeepPartial<ReporterOptions>) => {
  const reporterOptions = parseCustomReporterOptions(options);
  const { outputFile = KNIP_REPORT_NAME, rawOutputFile } = reporterOptions;

  if (rawOutputFile) {
    await ensureDirectoryExists(dirname(rawOutputFile));
    await writeFile(
      rawOutputFile,
      JSON.stringify({ report, issues, options: reporterOptions }, null, 2),
    );
    ui().logger.info(`Saved raw report to ${rawOutputFile}`);
  }

  const result = await knipToCpReport({ issues, report });

  await ensureDirectoryExists(dirname(outputFile));
  await writeFile(outputFile, JSON.stringify(result, null, 2));
  ui().logger.info(`Saved report to ${outputFile}`);
};
