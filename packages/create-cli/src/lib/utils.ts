import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import {
  NX_JSON_CONTENT,
  NX_JSON_FILENAME,
  PROJECT_JSON_CONTENT,
  PROJECT_JSON_FILENAME,
  PROJECT_NAME,
} from './constants';

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
  return output.trim().replace('NX', '<↗>');
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

  const projectJsonContent = (
    await readFile(PROJECT_JSON_FILENAME, 'utf8')
  ).toString();
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
  const toDelete: Promise<unknown>[] = [];
  if (nxJsonTeardown) {
    // eslint-disable-next-line functional/immutable-data
    toDelete.push(rm(NX_JSON_FILENAME));
  }
  if (projectJsonTeardown) {
    // eslint-disable-next-line functional/immutable-data
    toDelete.push(rm(PROJECT_JSON_FILENAME));
  }
  await Promise.all(toDelete);
}
