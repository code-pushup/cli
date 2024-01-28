import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { coreConfigSchema, reportSchema } from '../../src';
import { generateMdFile, generateTypesString } from './utils';

const nodeString = generateTypesString({
  coreConfigSchema,
  reportSchema,
});
// eslint disable-next-line
const dest: string = join(process.cwd(), '..', 'docs', 'core-config-types.md');
// eslint disable-next-line
void writeFile(dest, generateMdFile(nodeString), { encoding: 'utf8' });
