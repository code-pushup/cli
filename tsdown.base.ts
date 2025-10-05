import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type UserConfig, defineConfig } from 'tsdown';

export function baseConfig(options: {
  projectRoot: string;
  projectName?: string;
}): UserConfig {
  const { projectRoot } = options;

  return defineConfig({
    entry: `${projectRoot}/src/**/!(*.test|*.mock).ts`,
    tsconfig: `${projectRoot}/tsconfig.lib.json`,
    outDir: `${projectRoot}/dist/src`,
    unbundle: true,
    format: ['esm', 'cjs'],
    fixedExtension: true,
    dts: true,
    hash: false,
    external: [],
    copy: [
      {
        from: `${projectRoot}/README.md`,
        to: `${projectRoot}/dist/README.md`,
      },
    ],
  });
}

export function getProjectNameFromActiveTask(): string {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];

  if (!projectName || typeof projectName !== 'string') {
    throw new Error('NX_TASK_TARGET_PROJECT is not set');
  }

  return projectName;
}

export async function getExternalDependencies(cwd: string): Promise<string[]> {
  try {
    const packageJson = JSON.parse(
      await readFile(join(cwd, 'package.json'), 'utf8'),
    );

    return [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {}),
      ...Object.keys(packageJson.optionalDependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ];
  } catch {
    // No package.json or unable to read it - return empty array
    return [];
  }
}
