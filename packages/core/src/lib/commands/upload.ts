import {ReportFragment, uploadToPortal} from '@code-pushup/portal-client';
import {readFileSync} from 'fs';
import {join} from 'path';
import {jsonToGql} from '../implementation/json-to-gql';
import {CoreConfig, reportSchema} from '@code-pushup/models';

export type UploadOptions = Pick<CoreConfig, 'upload' | 'persist'>;

/**
 * Uploads collected audits to the portal
 * @param options
 */
export async function upload(
  options: UploadOptions,
  uploadFn: typeof uploadToPortal = uploadToPortal,
): Promise<ReportFragment> {
  console.log("upload options: ", options);

  if (options?.upload === undefined) {
    throw new Error('upload config needs to be set');
  }

  const {apiKey, server, organization, project} = options.upload;
  const {outputPath} = options.persist;
  const report = reportSchema.parse(
    JSON.parse(readFileSync(join(outputPath, 'report.json')).toString()),
  );

  const data = {
    organization,
    project,
    commit: '8b130390059a9986fd06f9c9fc2415ad7963da5b',
    ...jsonToGql(report),
  };

  return uploadFn({apiKey, server, data}).catch(e => {
    throw new Error('upload failed. ' + e.message);
  });
}
