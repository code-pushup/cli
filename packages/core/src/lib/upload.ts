import { uploadToPortal } from '@code-pushup/portal-client';
import { CoreConfig, Report } from '@code-pushup/models';
import { getLatestCommit, loadReport } from '@code-pushup/utils';
import { GlobalOptions } from './implementation/global-options';
import { jsonToGql } from './implementation/json-to-gql';

export type UploadOptions = Pick<CoreConfig, 'upload' | 'persist'> &
  GlobalOptions;

/**
 * Uploads collected audits to the portal
 * @param options
 */
export async function upload(
  options: UploadOptions,
  uploadFn: typeof uploadToPortal = uploadToPortal,
) {
  if (options?.upload === undefined) {
    throw new Error('upload config needs to be set');
  }
  const { apiKey, server, organization, project } = options.upload;
  const { outputDir, filename } = options.persist;
  const report: Report = await loadReport({
    outputDir,
    filename: filename,
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
