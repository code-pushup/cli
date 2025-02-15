import { createRequire } from 'node:module';
import type { PluginConfig } from '@code-pushup/models';
import { stringifyError } from '@code-pushup/utils';
import { DEFAULT_TS_CONFIG, TYPESCRIPT_PLUGIN_SLUG } from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import type { DiagnosticsOptions } from './runner/ts-runner.js';
import { typescriptPluginConfigSchema } from './schema.js';
import type { AuditSlug } from './types.js';
import { getAudits, getGroups, logSkippedAudits } from './utils.js';

const packageJson = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

export type FilterOptions = { onlyAudits?: AuditSlug[] };
export type TypescriptPluginOptions = Partial<DiagnosticsOptions> &
  FilterOptions;

export async function typescriptPlugin(
  options?: TypescriptPluginOptions,
): Promise<PluginConfig> {
  const { tsconfig = DEFAULT_TS_CONFIG, onlyAudits } = parseOptions(
    options ?? {},
  );

  const filteredAudits = getAudits({ onlyAudits });
  const filteredGroups = getGroups({ onlyAudits });

  logSkippedAudits(filteredAudits);

  return {
    slug: TYPESCRIPT_PLUGIN_SLUG,
    packageName: packageJson.name,
    version: packageJson.version,
    title: 'Typescript',
    description: 'Official Code PushUp Typescript plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/typescript-plugin/',
    icon: 'typescript',
    audits: filteredAudits,
    groups: filteredGroups,
    runner: createRunnerFunction({
      tsconfig,
      expectedAudits: filteredAudits,
    }),
  };
}

function parseOptions(
  tsPluginOptions: TypescriptPluginOptions,
): TypescriptPluginConfig {
  try {
    return typescriptPluginConfigSchema.parse(tsPluginOptions);
  } catch (error) {
    throw new Error(
      `Error parsing TypeScript Plugin options: ${stringifyError(error)}`,
    );
  }
}
