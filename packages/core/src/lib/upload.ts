import {
  type SaveReportMutationVariables,
  uploadToPortal,
} from '@code-pushup/portal-client';
import { PersistConfig, Report, UploadConfig } from '@code-pushup/models';
import { getLatestCommit, loadReport } from '@code-pushup/utils';
import { reportToGQL } from './implementation/report-to-gql';
import { GlobalOptions } from './types';

export type UploadOptions = { upload?: UploadConfig } & {
  persist: Required<PersistConfig>;
} & GlobalOptions;

/**
 * Uploads collected audits to the portal
 * @param options
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
  const commitData = await getLatestCommit();
  if (!commitData) {
    throw new Error('no commit data available');
  }

  const data: SaveReportMutationVariables = {
    organization,
    project,
    commit: commitData.hash,
    ...reportToGQL(report),
  };

  return uploadFn({ apiKey, server, data, timeout });
}
