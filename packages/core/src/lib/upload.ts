import { uploadToPortal } from '@code-pushup/portal-client';
import { PersistConfig, Report, UploadConfig } from '@code-pushup/models';
import { getLatestCommit, loadReport } from '@code-pushup/utils';
import { jsonReportToGql } from './implementation/json-to-gql';
import { normalizePersistConfig } from './normalize';
import { GlobalOptions } from './types';

export type UploadOptions = { upload: UploadConfig } & {
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
  const persist = normalizePersistConfig(options.persist);
  if (!options.upload) {
    throw new Error('upload config must be set');
  }
  const { apiKey, server, organization, project, timeout } = options.upload;
  const report: Report = await loadReport({
    ...persist,
    format: 'json',
  });
  const commitData = await getLatestCommit();
  if (!commitData) {
    throw new Error('no commit data available');
  }

  const data = {
    organization,
    project,
    commit: commitData.hash,
    ...jsonReportToGql(report),
  };

  return uploadFn({ apiKey, server, data, timeout });
}
