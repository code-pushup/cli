import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { uploadToPortal } from '@code-pushup/portal-client';
import { CoreConfig, reportSchema } from '@code-pushup/models';
import { latestHash } from '@code-pushup/utils';
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

  const reportPath = join(outputDir, 'report.json');

  if (!existsSync(reportPath)) {
    throw new Error(`report.json not found. Did you run collect first?`);
  }

  const report = reportSchema.parse(
    JSON.parse(readFileSync(reportPath).toString()),
  );

  const data = {
    organization,
    project,
    commit: await latestHash(),
    ...jsonToGql(report),
  };

  return uploadFn({ apiKey, server, data }).catch(e => {
    const error = new Error('upload failed. ' + e.message);
    error.stack = e.stack;
    throw error;
  });
}
