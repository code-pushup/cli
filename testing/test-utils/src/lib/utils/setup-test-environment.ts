import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type SimpleGit, simpleGit } from 'simple-git';
import { E2E_ENVIRONMENTS_DIR, TEST_OUTPUT_DIR } from '../constants.js';
import { type GitConfig, initGitRepo, simulateGitFetch } from './git.js';
import {
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from './test-folder-setup.js';

export type TestEnvironmentBase = {
  baseDir: string;
  cleanup: () => Promise<void>;
};

export type TestEnvironmentWithGit = {
  git: SimpleGit;
} & TestEnvironmentBase;

export type TestEnvironmentWithoutGit = {
  git?: undefined;
} & TestEnvironmentBase;

export type TestEnvironment =
  | TestEnvironmentWithGit
  | TestEnvironmentWithoutGit;

export type FixturePath = string | string[];

export type SetupOptionsBase = {
  callerUrl: string;
  testId?: string;
};

export type SetupOptionsWithGit = {
  git: true | GitConfig;
} & SetupOptionsBase;

export type SetupOptionsWithoutGit = {
  git?: false;
} & SetupOptionsBase;

export type SetupOptions = SetupOptionsWithGit | SetupOptionsWithoutGit;

/**
 * Creates a unified test environment from fixture files with optional Git initialization.
 *
 * @param fixturePath - Path to fixture directory. Can be:
 *   - Array of path segments (e.g., ['mocks', 'fixtures', 'basic']) - joined with path.join()
 *   - String path (e.g., 'mocks/fixtures/flat-config') - normalized with path.normalize()
 *   - Absolute path - used directly
 * @param options - Configuration including callerUrl (required), optional Git and test directory naming
 * @returns TestEnvironment with baseDir, optional git instance, and cleanup function
 */
export async function setupTestEnvironment(
  fixturePath: FixturePath,
  options: SetupOptionsWithGit,
): Promise<TestEnvironmentWithGit>;
export async function setupTestEnvironment(
  fixturePath: FixturePath,
  options: SetupOptionsWithoutGit,
): Promise<TestEnvironmentWithoutGit>;
export async function setupTestEnvironment(
  fixturePath: FixturePath,
  options: SetupOptions,
): Promise<TestEnvironment> {
  if (!options.callerUrl) {
    throw new TypeError(
      'options.callerUrl is required. Pass import.meta.url from your test file.',
    );
  }

  const { callerUrl, git: gitOption, testId } = options;

  const normalizedPath = normalizeFixturePath(fixturePath);
  const resolvedFixturePath = resolveFixturePath(normalizedPath, callerUrl);
  const testDirName = testId || path.basename(normalizedPath);

  // Inline nxTargetProject functionality to avoid circular dependency
  const project = process.env['NX_TASK_TARGET_PROJECT'];
  if (project == null) {
    throw new Error(
      'Process environment variable NX_TASK_TARGET_PROJECT is undefined.',
    );
  }

  const baseDir = path.join(
    process.cwd(),
    E2E_ENVIRONMENTS_DIR,
    project,
    TEST_OUTPUT_DIR,
    testDirName,
  );

  await cp(resolvedFixturePath, baseDir, { recursive: true });
  await restoreNxIgnoredFiles(baseDir);

  let git: SimpleGit | undefined;

  if (gitOption) {
    const gitConfig = typeof gitOption === 'boolean' ? undefined : gitOption;
    git = await initGitRepo(simpleGit, {
      baseDir,
      config: gitConfig,
    });

    await simulateGitFetch(git);

    await git.add('.');
    await git.commit('Initial commit');
  }

  return {
    baseDir,
    git,
    cleanup: () => teardownTestFolder(baseDir),
  };
}

/**
 * Normalizes fixture path input to a string path.
 * - Arrays are joined using path.join() for cross-platform compatibility
 * - Strings are normalized using path.normalize()
 */
function normalizeFixturePath(input: FixturePath): string {
  if (Array.isArray(input)) {
    if (input.length === 0) {
      throw new Error('Fixture path segments array cannot be empty');
    }
    return path.join(...input);
  }
  return path.normalize(input);
}

function resolveFixturePath(fixturePath: string, callerUrl: string): string {
  if (path.isAbsolute(fixturePath)) {
    return fixturePath;
  }

  const callerDir = path.dirname(fileURLToPath(callerUrl));
  return path.resolve(callerDir, fixturePath);
}
