import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type PortalDownloadArgs,
  downloadFromPortal,
} from '@code-pushup/portal-client';
import { transformGQLReport } from './transform.js';

export async function downloadReportFromPortal(
  args: PortalDownloadArgs,
): Promise<string | null> {
  const gqlReport = await downloadFromPortal(args);
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
