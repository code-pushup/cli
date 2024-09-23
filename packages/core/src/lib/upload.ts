import {
  type SaveReportMutationVariables,
  uploadToPortal,
} from '@code-pushup/portal-client';
import type { PersistConfig, Report, UploadConfig } from '@code-pushup/models';
import { loadReport } from '@code-pushup/utils';
import { reportToGQL } from './implementation/report-to-gql';
import type { GlobalOptions } from './types';

export type UploadOptions = { upload?: UploadConfig } & {
  persist: Required<PersistConfig>;
} & Partial<GlobalOptions>;

/**
 * Uploads collected audits to the portal
 * @param options
 * @param uploadFn
 */
export async function upload(
  options: UploadOptions,
  uploadFn: typeof uploadToPortal = uploadToPortal,
) {
  if (options.upload == null) {
    throw new Error('Upload configuration is not set.');
  }
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

  return uploadFn({ apiKey, server, data, timeout });
}
