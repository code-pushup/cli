import type { ProjectConfiguration } from '@nx/devkit';
import { join } from 'node:path';
import { fileExists, toArray } from '@code-pushup/utils';
import type { ConfigFormat } from '../meta';

const ESLINT_CONFIG_EXTENSIONS: Record<ConfigFormat, string[]> = {
  // https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats
  flat: ['js', 'mjs', 'cjs'],
  // https://eslint.org/docs/latest/use/configure/configuration-files-deprecated
  legacy: ['json', 'js', 'cjs', 'yml', 'yaml'],
};
const ESLINT_CONFIG_NAMES: Record<ConfigFormat, string[]> = {
  // https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats
  flat: ['eslint.config'],
  // https://eslint.org/docs/latest/use/configure/configuration-files-deprecated
  legacy: ['.eslintrc'],
};

const CP_ESLINT_CONFIG_NAMES: Record<ConfigFormat, string[]> = {
  flat: [
    'code-pushup.eslint.config',
    'eslint.code-pushup.config',
    'eslint.config.code-pushup',
    'eslint.strict.config',
    'eslint.config.strict',
  ],
  legacy: ['code-pushup.eslintrc', '.eslintrc.code-pushup', '.eslintrc.strict'],
};

export async function findCodePushupEslintConfig(
  project: ProjectConfiguration,
  format: ConfigFormat,
): Promise<string | undefined> {
  return findProjectFile(project, {
    names: CP_ESLINT_CONFIG_NAMES[format],
    extensions: ESLINT_CONFIG_EXTENSIONS[format],
  });
}

export async function findEslintConfig(
  project: ProjectConfiguration,
  format: ConfigFormat,
): Promise<string | undefined> {
  const options = project.targets?.['lint']?.options as
    | { eslintConfig?: string }
    | undefined;
  return (
    options?.eslintConfig ??
    (await findProjectFile(project, {
      names: ESLINT_CONFIG_NAMES[format],
      extensions: ESLINT_CONFIG_EXTENSIONS[format],
    }))
  );
}

export function getLintFilePatterns(
  project: ProjectConfiguration,
  format: ConfigFormat,
): string[] {
  const options = project.targets?.['lint']?.options as
    | { lintFilePatterns?: string | string[] }
    | undefined;
  // lintFilePatterns defaults to ["{projectRoot}"] - https://github.com/nrwl/nx/pull/20313
  const defaultPatterns =
    format === 'legacy'
      ? `${project.root}/**/*` // files not folder needed for legacy because rules detected with ESLint.calculateConfigForFile
      : project.root;
  const patterns =
    options?.lintFilePatterns == null
      ? [defaultPatterns]
      : toArray(options.lintFilePatterns);
  if (format === 'legacy') {
    return [
      ...patterns,
      // HACK: ESLint.calculateConfigForFile won't find rules included only for subsets of *.ts when globs used
      // so we explicitly provide additional patterns used by @code-pushup/eslint-config to ensure those rules are included
      // this workaround is only necessary for legacy configs (rules are detected more reliably in flat configs)
      `${project.root}/*.spec.ts`, // jest/* and vitest/* rules
      `${project.root}/*.cy.ts`, // cypress/* rules
      `${project.root}/*.stories.ts`, // storybook/* rules
      `${project.root}/.storybook/main.ts`, // storybook/no-uninstalled-addons rule
    ];
  }
  return patterns;
}

async function findProjectFile(
  project: ProjectConfiguration,
  file: {
    names: string[];
    extensions: string[];
  },
): Promise<string | undefined> {
  // eslint-disable-next-line functional/no-loop-statements
  for (const name of file.names) {
    // eslint-disable-next-line functional/no-loop-statements
    for (const ext of file.extensions) {
      const filename = `./${project.root}/${name}.${ext}`;
      if (await fileExists(join(process.cwd(), filename))) {
        return filename;
      }
    }
  }
  return undefined;
}
