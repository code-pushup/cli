import {
  type PortalDownloadArgs,
  downloadFromPortal,
} from '@code-pushup/portal-client';
import { transformGQLReport } from './transform.js';

export async function downloadReportFromPortal(
  args: PortalDownloadArgs,
): Promise<string | undefined> {
  const gqlReport = await downloadFromPortal(args);
  if (!gqlReport) {
    return undefined;
  }
  const report = transformGQLReport(gqlReport);
  return JSON.stringify(report, null, 2);
}
