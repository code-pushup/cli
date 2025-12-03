import { createRequire } from 'node:module';
import { type PluginConfig, validate } from '@code-pushup/models';
import { stringifyError } from '@code-pushup/utils';
import { DEFAULT_TS_CONFIG, TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import {
  type TypescriptPluginConfig,
  type TypescriptPluginOptions,
  typescriptPluginConfigSchema,
} from './schema.js';
import { getAudits, getGroups, logSkippedAudits } from './utils.js';

const packageJson = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

export function typescriptPlugin(
  options?: TypescriptPluginOptions,
): PluginConfig {
  const {
    tsconfig = DEFAULT_TS_CONFIG,
    onlyAudits,
    scoreTargets,
  } = parseOptions(options ?? {});

  const filteredAudits = getAudits({ onlyAudits });
  const filteredGroups = getGroups({ onlyAudits });

  logSkippedAudits(filteredAudits);

  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName: packageJson.name,
    version: packageJson.version,
    title: 'TypeScript',
    description: 'Official Code PushUp TypeScript plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/typescript-plugin/',
    icon: 'typescript',
    audits: filteredAudits,
    groups: filteredGroups,
    runner: createRunnerFunction({
      tsconfig,
      expectedAudits: filteredAudits,
    }),
    ...(scoreTargets && { scoreTargets }),
  };
}

function parseOptions(
  tsPluginOptions: TypescriptPluginOptions,
): TypescriptPluginConfig {
  try {
    return validate(typescriptPluginConfigSchema, tsPluginOptions);
  } catch (error) {
    throw new Error(
      `Error parsing TypeScript Plugin options: ${stringifyError(error)}`,
    );
  }
}
