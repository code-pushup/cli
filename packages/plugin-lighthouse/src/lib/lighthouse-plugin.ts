import { Audit, AuditOutputs, PluginConfig } from '@code-pushup/models';
import { filterByAuditSlug, filterBySlug } from '@code-pushup/utils';
import { AUDITS, GROUPS, LIGHTHOUSE_PLUGIN_SLUG } from './constants';

type AuditSlug = (typeof AUDITS)[number]['slug'];
export type LighthousePluginOptions = {
  url: string;
  outputPath?: string;
  onlyAudits?: AuditSlug | AuditSlug[];
  verbose?: boolean;
  headless?: boolean;
  userDataDir?: string;
};

export function lighthousePlugin(
  options: LighthousePluginOptions,
): PluginConfig {
  const { onlyAudits = [] } = options;
  const audits: Audit[] = filterBySlug(AUDITS, onlyAudits);

  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups: filterByAuditSlug(GROUPS, onlyAudits),
    runner: (): AuditOutputs =>
      audits.map(audit => ({
        ...audit,
        score: 0,
        value: 0,
      })),
  };
}
