import {PluginConfig} from '@code-pushup/models';
import {KNIP_AUDITS, KNIP_GROUPS, KNIP_PLUGIN_SLUG} from './constants';
import {createRunnerConfig, RunnerOptions} from "./runner";

export type PluginOptions = RunnerOptions;

export function knipPlugin(options: PluginOptions = {}): PluginConfig {
  return {
    slug: KNIP_PLUGIN_SLUG,
    title: 'Knip',
    icon: 'folder-javascript',
    description: 'A plugin to track dependencies and duplicates',
    runner: createRunnerConfig(options),
    audits: KNIP_AUDITS,
    groups: KNIP_GROUPS,
  };
}

export default knipPlugin;
