import { AuditOutputs, PluginConfig } from '@code-pushup/models';
import { AUDITS, GROUPS, LIGHTHOUSE_PLUGIN_SLUG } from './constants';

export type LighthousePluginOptions = {
  url: string;
  outputPath?: string;
  onlyAudits?: string | string[];
  verbose?: boolean;
  headless?: boolean;
  userDataDir?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function lighthousePlugin(_: LighthousePluginOptions): PluginConfig {
  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits: AUDITS,
    groups: GROUPS,
    runner: (): AuditOutputs =>
      AUDITS.map(audit => ({
        ...audit,
        score: 0,
        value: 0,
      })),
  };
}
