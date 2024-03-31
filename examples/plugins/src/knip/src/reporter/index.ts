import { writeFile } from 'node:fs/promises';
import type { ReporterOptions } from 'knip/dist/types/issues';
import { knipToCpReport } from './utils';
import {ensureDirectoryExists} from "@code-pushup/utils";
import {dirname} from "node:path";

/**
 * @example
 *
 * npx knip --reporter ./code-pushup.reporter.ts --reporter-options '{"outputFile":"tmp"}'
 *
 */
export type CustomReporterOptions = {
  outputFile?: string;
  rawOutputFile?: string;
};

function parseCustomReporterOptions(
  optionsString?: string,
): Record<string, unknown> {
  return typeof optionsString === 'string' && optionsString !== ''
    ? (JSON.parse(optionsString) as Record<string, unknown>)
    : {};
}

export const knipReporter = async ({
  report,
  issues,
  options,
}: ReporterOptions) => {
  const reporterOptions = parseCustomReporterOptions(
    options,
  ) as CustomReporterOptions;
  const { outputFile = `knip-report.json`, rawOutputFile } = reporterOptions;
  if (rawOutputFile) {
    ensureDirectoryExists(dirname(rawOutputFile));
    await writeFile(
      rawOutputFile,
      JSON.stringify({ report, issues, options: reporterOptions }, null, 2),
    );
  }
  const result = knipToCpReport({ issues });

  ensureDirectoryExists(dirname(outputFile));
  await writeFile(outputFile, JSON.stringify(result, null, 2));
};

export default knipReporter;
