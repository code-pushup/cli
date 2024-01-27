import {writeFile} from "node:fs/promises";
import {generateTypesString} from "./utils";
import {
  auditSchema, pluginAuditsSchema,
  auditOutputsSchema,
  categoryConfigSchema,
  categoryRefSchema,
  coreConfigSchema,
  unrefinedCoreConfigSchema,
  fileNameSchema,
  filePathSchema,
  materialIconSchema,
  urlSchema,
  formatSchema,
  persistConfigSchema,
  pluginConfigSchema,
  auditReportSchema,
  pluginReportSchema,
  reportSchema,
  onProgressSchema,
  runnerConfigSchema,
  uploadConfigSchema
} from "../../src";
import {join} from "node:path";

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
  uploadConfigSchema
});
// eslint disable-next-line
const dest: string = join(process.cwd(), '..', 'src', 'types.generated.ts');
// eslint disable-next-line
void writeFile(dest, nodeString, {encoding: 'utf8'});
