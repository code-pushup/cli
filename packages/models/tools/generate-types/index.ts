import { join } from 'node:path';
import { coreConfigSchema, reportSchema } from '../../src';
import { generateMdFile, generateTypesString, safeWriteFile } from './utils';

const nodeString = generateTypesString({
  coreConfigSchema,
  reportSchema,
});
// eslint disable-next-line
const destDir: string = join(process.cwd(), '..', 'docs');
const dest: string = join(destDir, 'core-config-types.md');
const content: string = generateMdFile(nodeString);
safeWriteFile(dest, content);
