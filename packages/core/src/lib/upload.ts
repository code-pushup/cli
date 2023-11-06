import { readFileSync } from 'fs';
import { join } from 'path';
import { uploadToPortal } from '@code-pushup/portal-client';
import { CoreConfig, reportSchema } from '@code-pushup/models';
import { getLatestCommit } from '@code-pushup/utils';
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
  const { outputDir } = options.persist;
  const report = reportSchema.parse(
    JSON.parse(readFileSync(join(outputDir, 'report.json')).toString()),
  );
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

  return uploadFn({ apiKey, server, data }).catch(e => {
    throw new Error('upload failed. ' + e.message);
  });
}
