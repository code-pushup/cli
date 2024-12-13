import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function createNpmWorkspace(cwd: string) {
  await mkdir(cwd, { recursive: true });
  await writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify(
      {
        name: 'create-npm-workspace',
        version: '0.0.1',
        scripts: {
          test: 'echo "Error: no test specified" && exit 1',
        },
        keywords: [],
      },
      null,
      2,
    ),
  );
}
