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
  return profiler.measureAsync(
    'core:upload',
    async () => {
      return logger.task('Uploading report to Portal', async () => {
        const portalClient = await profiler.measureAsync(
          'core:load-portal-client',
          () => loadPortalClient(),
          {
            color: 'primary-light',
            success: () => ({
              tooltipText: 'Portal client loaded successfully',
            }),
          },
        );
        const { uploadReportToPortal } = portalClient;
        const { apiKey, server, organization, project, timeout } =
          options.upload;
        const report: Report = await profiler.measureAsync(
          'core:load-report',
          () =>
            loadReport({
              ...options.persist,
              format: 'json',
            }),
          {
            color: 'primary-light',
            success: (report: Report) => ({
              properties: [
                ['Commit', report.commit?.hash.substring(0, 8) || 'unknown'],
                ['Plugins', String(report.plugins.length)],
                ['Categories', String(report.categories.length)],
              ],
              tooltipText: `Loaded report with ${report.plugins.length} plugins and ${report.categories.length} categories`,
            }),
          },
        );
        if (!report.commit) {
          throw new Error('Commit must be linked in order to upload report');
        }

        const data: SaveReportMutationVariables = {
          organization,
          project,
          commit: report.commit.hash,
          ...reportToGQL(report),
        };

        const { url } = await profiler.measureAsync(
          'core:upload-report-to-portal',
          () =>
            uploadReportToPortal({
              apiKey,
              server,
              data,
              timeout,
            }),
          {
            color: 'primary-light',
            success: ({ url }: { url: string }) => ({
              properties: [
                ['Portal URL', url],
                ['Organization', organization],
                ['Project', project],
              ],
              tooltipText: `Successfully uploaded report to Portal`,
            }),
          },
        );
        logger.info(formatAsciiLink(url));

        return `Uploaded report to Portal`;
      });
    },
    {
      color: 'primary',
      success: (message: string) => ({
        tooltipText: message,
      }),
    },
  );
}
