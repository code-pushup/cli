import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getConstantsFileContent, getExampleReport } from './utils';

async function run() {
  const lhr = await getExampleReport({ deleteFile: false });
  const content = getConstantsFileContent(lhr);
  await writeFile(join('..', 'src', 'lib', 'constants.generated.ts'), content);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void run();
