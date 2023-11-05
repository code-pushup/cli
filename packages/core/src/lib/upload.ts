import { uploadToPortal } from '@code-pushup/portal-client';
import { CoreConfig } from '@code-pushup/models';
import { latestHash, loadReport } from '@code-pushup/utils';
import { jsonToGql } from './implementation/json-to-gql';

export type UploadOptions = Pick<CoreConfig, 'upload' | 'persist'>;

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
  const report = await loadReport({
    outputDir: options.persist.outputDir,
    filename: options.persist.filename,
    format: 'json',
  });

  const reportJson = JSON.parse(report);
  const data = {
    organization,
    project,
    commit: await latestHash(),
    ...jsonToGql(reportJson),
  };

  return uploadFn({ apiKey, server, data });
}
