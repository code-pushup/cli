import { uploadToPortal } from '@code-pushup/portal-client';
import { PersistConfig, Report, UploadConfig } from '@code-pushup/models';
import { getLatestCommit, loadReport } from '@code-pushup/utils';
import { jsonToGql } from './implementation/json-to-gql';
import {
  GlobalOptions,
  persistConfigPresetSchema,
  uploadConfigPresetSchema,
} from './types';

export type UploadOptions = { upload: Required<UploadConfig> } & {
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
  const persist = persistConfigPresetSchema.parse(options.persist);
  const upload = uploadConfigPresetSchema.parse(options.upload);
  const { apiKey, server, organization, project } = upload;
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
    ...jsonToGql(report),
  };

  return uploadFn({ apiKey, server, data });
}
