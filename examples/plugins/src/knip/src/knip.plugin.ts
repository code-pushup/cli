import { join } from 'node:path';
import { PluginConfig } from '@code-pushup/models';
import { KNIP_AUDITS, KNIP_GROUPS, KNIP_PLUGIN_SLUG } from './constants';
import { RunnerOptions, createRunnerConfig } from './runner';

export type PluginOptions = RunnerOptions;

export function knipPlugin(options: PluginOptions = {}): PluginConfig {
  const {
    outputFile = join(
      '.code-pushup',
      KNIP_PLUGIN_SLUG,
      `knip-report-${Date.now()}.json`,
    ),
    ...runnerOptions
  } = options;
  return {
    slug: KNIP_PLUGIN_SLUG,
    title: 'Knip',
    icon: 'folder-javascript',
    description: 'A plugin to track dependencies and duplicates',
    runner: createRunnerConfig({
      ...runnerOptions,
      outputFile,
    }),
    audits: KNIP_AUDITS,
    groups: KNIP_GROUPS,
  };
}

export default knipPlugin;
