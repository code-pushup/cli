import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import { CODE_PUSHUP_UNICODE_LOGO } from '@code-pushup/utils';
import {
  NX_JSON_CONTENT,
  NX_JSON_FILENAME,
  PROJECT_JSON_CONTENT,
  PROJECT_JSON_FILENAME,
  PROJECT_NAME,
} from './constants.js';

export type SetupResult = {
  filename: string;
  teardown: boolean;
};

export async function setupFile(
  filename: string,
  content = '',
): Promise<SetupResult> {
  const setupResult: SetupResult = {
    filename,
    teardown: false,
  };

  try {
    const stats = await stat(filename);
    if (!stats.isFile()) {
      await writeFile(filename, content);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('no such file or directory')
    ) {
      await writeFile(filename, content);
      return {
        ...setupResult,
        teardown: true,
      };
    } else {
      console.error(error);
    }
  }

  return setupResult;
}

export function parseNxProcessOutput(output: string) {
  return output.trim().replace('NX', CODE_PUSHUP_UNICODE_LOGO);
}

export async function setupNxContext(): Promise<{
  nxJsonTeardown: boolean;
  projectJsonTeardown: boolean;
  projectName: string;
}> {
  const { teardown: nxJsonTeardown } = await setupFile(
    NX_JSON_FILENAME,
    NX_JSON_CONTENT,
  );
  const { teardown: projectJsonTeardown } = await setupFile(
    PROJECT_JSON_FILENAME,
    PROJECT_JSON_CONTENT,
  );

  const projectJsonContent = await readFile(PROJECT_JSON_FILENAME, 'utf8');
  const { name = PROJECT_NAME } = JSON.parse(projectJsonContent) as {
    name: string;
  };

  return {
    nxJsonTeardown,
    projectJsonTeardown,
    projectName: name,
  };
}

export async function teardownNxContext({
  nxJsonTeardown,
  projectJsonTeardown,
}: {
  nxJsonTeardown: boolean;
  projectJsonTeardown: boolean;
}) {
  const filesToDelete = [
    ...(nxJsonTeardown ? [NX_JSON_FILENAME] : []),
    ...(projectJsonTeardown ? [PROJECT_JSON_FILENAME] : []),
  ];
  await Promise.all(filesToDelete.map(file => rm(file)));
}
