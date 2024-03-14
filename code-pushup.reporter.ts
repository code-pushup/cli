import type { ReporterOptions } from 'knip/dist/types/issues';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { knipToCpReport } from './dist/examples/plugins';

/**
 * @example
 *
 * npx knip --reporter ./code-pushup.reporter.ts --reporter-options '{"outputDir":"tmp"}'
 *
 */
export default async ({ report, issues, options }: ReporterOptions) => {
  const reporterOptions = options ? JSON.parse(options) : {};
  const { outputFile = join('.code-pushup', `knip-report.json`) } =
    reporterOptions;
  await writeFile(
    join(dirname(outputFile), 'knip-raw.json'),
    JSON.stringify({ report, issues, options: reporterOptions }, null, 2),
  );

  const result = knipToCpReport({ issues });

  console.log(`Save code-pushup AuditOutputs under: ${outputFile}.`);
  await writeFile(outputFile, JSON.stringify(result, null, 2));
};
