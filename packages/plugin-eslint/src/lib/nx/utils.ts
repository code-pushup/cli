import type { ProjectConfiguration } from '@nx/devkit';
import { join } from 'node:path';
import { fileExists, toArray } from '@code-pushup/utils';

export async function findCodePushupEslintrc(
  project: ProjectConfiguration,
): Promise<string | null> {
  const name = 'code-pushup.eslintrc';
  // https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats
  const extensions = ['json', 'js', 'cjs', 'yml', 'yaml'];

  // eslint-disable-next-line functional/no-loop-statements
  for (const ext of extensions) {
    const filename = `./${project.root}/${name}.${ext}`;
    if (await fileExists(join(process.cwd(), filename))) {
      return filename;
    }
  }

  return null;
}

export function getLintFilePatterns(project: ProjectConfiguration): string[] {
  const options = project.targets?.['lint']?.options as
    | { lintFilePatterns?: string | string[] }
    | undefined;
  return options?.lintFilePatterns == null
    ? [`${project.root}/**/*`] // lintFilePatterns defaults to ["{projectRoot}"] - https://github.com/nrwl/nx/pull/20313
    : toArray(options.lintFilePatterns);
}

export function getEslintConfig(
  project: ProjectConfiguration,
): string | undefined {
  const options = project.targets?.['lint']?.options as
    | { eslintConfig?: string }
    | undefined;
  return options?.eslintConfig ?? `./${project.root}/.eslintrc.json`;
}
