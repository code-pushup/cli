import { join } from 'node:path';
import { coreConfigSchema, reportSchema } from '../../src';
import { generateMdFile, generateTypesString, safeWriteFile } from './utils';

const nodeString = generateTypesString({
  coreConfigSchema,
  reportSchema,
});
// eslint disable-next-line
// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
const destDir: string = join(process.cwd(), '..', 'docs');
// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
const dest: string = join(destDir, 'core-config-types.md');
const content: string = generateMdFile(nodeString);
void safeWriteFile(dest, content);
