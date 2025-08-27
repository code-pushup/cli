import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type PortalReportDownloadArgs,
  downloadReportFromPortal,
} from '@code-pushup/portal-client';
import { transformGQLReport } from './transform.js';

export async function downloadFromPortal(
  args: PortalReportDownloadArgs,
): Promise<string | null> {
  const gqlReport = await downloadReportFromPortal(args);
  if (!gqlReport) {
    return null;
  }

  const report = transformGQLReport(gqlReport);

  const outputFile = path.join(
    'tmp',
    'code-pushup',
    'portal',
    args.parameters.organization,
    args.parameters.project,
    'report.json',
  );
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, JSON.stringify(report, null, 2));
  return outputFile;
}
