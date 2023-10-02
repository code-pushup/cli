import { CoreConfig, GlobalOptions } from '@quality-metrics/models';
import { uploadToPortal, ReportFragment } from '@code-pushup/portal-client';
import { readFileSync } from 'fs';
import { join } from 'path';

export type UploadOptions = GlobalOptions & CoreConfig;

/**
 * Uploads collected audits to the portal
 * @param options
 */
export async function upload(options: UploadOptions): Promise<ReportFragment> {
  if (options?.upload === undefined) {
    throw new Error('upload config needs to be set');
  }

  const { apiKey, server, organization, project } = options.upload;
  const { outputPath } = options.persist;

  const report = JSON.parse(
    readFileSync(join(outputPath, 'report.json')).toString(),
  );

  const data = {
    ...report,
    organization,
    project,
    commit: '',
  };

  return uploadToPortal({ apiKey, server, data }).catch(e => {
    throw new Error('upload failed. ' + e.message);
  });
}
