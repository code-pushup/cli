import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  auditOutputsSchema,
  auditReportSchema,
  auditSchema,
  categoryConfigSchema,
  categoryRefSchema,
  coreConfigSchema,
  fileNameSchema,
  filePathSchema,
  formatSchema,
  materialIconSchema,
  onProgressSchema,
  persistConfigSchema,
  pluginAuditsSchema,
  pluginConfigSchema,
  pluginReportSchema,
  reportSchema,
  runnerConfigSchema,
  unrefinedCoreConfigSchema,
  uploadConfigSchema,
  urlSchema,
} from '../../src';
import { generateTypesString } from './utils';

const nodeString = generateTypesString({
  fileNameSchema: fileNameSchema('File Name'),
  filePathSchema: filePathSchema('File Path'),
  materialIconSchema,
  urlSchema: urlSchema('Url'),
  auditSchema,
  pluginAuditsSchema,
  auditOutputsSchema,
  categoryConfigSchema,
  categoryRefSchema,
  coreConfigSchema,
  unrefinedCoreConfigSchema,
  formatSchema,
  persistConfigSchema,
  pluginConfigSchema,
  auditReportSchema,
  pluginReportSchema,
  reportSchema,
  onProgressSchema,
  runnerConfigSchema,
  uploadConfigSchema,
});
// eslint disable-next-line
const dest: string = join(process.cwd(), '..', 'src', 'types.generated.ts');
// eslint disable-next-line
void writeFile(dest, nodeString, { encoding: 'utf8' });
