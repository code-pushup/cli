import type { SaveReportMutationVariables } from '@code-pushup/portal-client';
import type { PersistConfig, Report, UploadConfig } from '@code-pushup/models';
import { loadReport } from '@code-pushup/utils';
import { reportToGQL } from './implementation/report-to-gql.js';
import { loadPortalClient } from './load-portal-client.js';

export type UploadOptions = { upload?: UploadConfig } & {
  persist: Required<PersistConfig>;
};

/**
 * Uploads collected audits to the portal
 * @param options
 * @param uploadFn
 */
export async function upload(options: UploadOptions) {
  if (options.upload == null) {
    throw new Error('Upload configuration is not set.');
  }
  const portalClient = await loadPortalClient();
  if (!portalClient) {
    return;
  }
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

  return uploadReportToPortal({ apiKey, server, data, timeout });
}
