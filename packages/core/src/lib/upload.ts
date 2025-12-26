import type { SaveReportMutationVariables } from '@code-pushup/portal-client';
import type { PersistConfig, Report, UploadConfig } from '@code-pushup/models';
import {
  formatAsciiLink,
  loadReport,
  logger,
  profiler,
} from '@code-pushup/utils';
import { reportToGQL } from './implementation/report-to-gql.js';
import { loadPortalClient } from './load-portal-client.js';

export type UploadOptions = {
  upload: UploadConfig;
  persist: Required<PersistConfig>;
};

/**
 * Uploads collected audits to the portal
 */
export async function upload(options: UploadOptions) {
  await logger.task('Uploading report to Portal', async () => {
    return profiler.span('upload', async () => {
      const portalClient = await loadPortalClient();
      const { uploadReportToPortal } = portalClient;
      const { apiKey, server, organization, project, timeout } = options.upload;
      const report: Report = await loadReport({
        ...options.persist,
        format: 'json',
      });
      if (!report.commit) {
        throw new Error('Commit must be linked in order to upload report');
      }

      const data: SaveReportMutationVariables = {
        organization,
        project,
        commit: report.commit.hash,
        ...reportToGQL(report),
      };

      const { url } = await uploadReportToPortal({
        apiKey,
        server,
        data,
        timeout,
      });
      logger.info(formatAsciiLink(url));

      return `Uploaded report to Portal`;
    });
  });
}
