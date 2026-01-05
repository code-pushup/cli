import { createRequire } from 'node:module';
import { type PluginConfig, validate } from '@code-pushup/models';
import { profiler, stringifyError } from '@code-pushup/utils';
import {
  DEFAULT_TS_CONFIG,
  TYPESCRIPT_PLUGIN_SLUG,
  TYPESCRIPT_PLUGIN_TITLE,
} from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import {
  type TypescriptPluginConfig,
  type TypescriptPluginOptions,
  typescriptPluginConfigSchema,
} from './schema.js';
import { getAudits, getGroups, logAuditsAndGroups } from './utils.js';

const packageJson = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

export function typescriptPlugin(
  options?: TypescriptPluginOptions,
): PluginConfig {
  return profiler.measure(
    'plugin-typescript:setup-config',
    () => {
      const {
        tsconfig = DEFAULT_TS_CONFIG,
        onlyAudits,
        scoreTargets,
      } = parseOptions(options ?? {});

      const audits = getAudits({ onlyAudits });
      const groups = getGroups({ onlyAudits });

      logAuditsAndGroups(audits, groups);

      return {
        slug: TYPESCRIPT_PLUGIN_SLUG,
        title: TYPESCRIPT_PLUGIN_TITLE,
        icon: 'typescript',
        description: 'Official Code PushUp TypeScript plugin.',
        docsUrl:
          'https://www.npmjs.com/package/@code-pushup/typescript-plugin/',
        packageName: packageJson.name,
        version: packageJson.version,
        audits,
        groups,
        runner: createRunnerFunction({
          tsconfig,
          expectedAudits: audits,
        }),
        ...(scoreTargets && { scoreTargets }),
      };
    },
    {
      ...profiler.measureConfig.tracks.pluginTypescript,
      success: (config: PluginConfig) => ({
        properties: [
          ['Audits', String(config.audits.length)],
          ['Groups', String(config.groups.length)],
        ],
        tooltipText: `Configured TypeScript plugin with ${config.audits.length} audits and ${config.groups.length} groups`,
      }),
    },
  );
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
