import { join } from 'node:path';
import { coreConfigSchema, reportSchema } from '../../src';
import { generateMdFile, generateTypesString, safeWriteFile } from './utils';

const nodeString = generateTypesString({
  coreConfigSchema,
  reportSchema,
});
const destDir: string = join(process.cwd(), '..', 'docs');
const dest: string = join(destDir, 'core-config-types.md');
const content: string = generateMdFile(nodeString);
void safeWriteFile(dest, content);
