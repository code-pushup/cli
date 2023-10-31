import { uploadToPortal } from '@code-pushup/portal-client';
import { CoreConfig, reportSchema } from '@code-pushup/models';
import {
  FileResult,
  MultipleFileResults,
  latestHash,
  loadReports,
  logMultipleFileResults,
} from '@code-pushup/utils';
import { jsonToGql } from './implementation/json-to-gql';

export type UploadOptions = Pick<CoreConfig, 'upload' | 'persist'>;

/**
 * Uploads collected audits to the portal
 * @param options
 */
export async function upload(
  options: UploadOptions,
  uploadFn: typeof uploadToPortal = uploadToPortal,
): Promise<MultipleFileResults> {
  if (options?.upload === undefined) {
    throw new Error('upload config needs to be set');
  }

  const { apiKey, server, organization, project } = options.upload;
  const reports = loadReports({ ...options.persist, format: ['json'] });

  const uploadResults: MultipleFileResults = await Promise.allSettled(
    reports.map(async ([filename, reportContent]: [string, string]) => {
      const report = reportSchema.parse(JSON.parse(reportContent));
      const data = {
        organization,
        project,
        commit: await latestHash(),
        ...jsonToGql(report),
      };
      return uploadFn({ apiKey, server, data }).then(
        () => [filename] satisfies FileResult,
      );
    }),
  );

  logMultipleFileResults(uploadResults, 'Uploaded reports');
  return uploadResults;
}
