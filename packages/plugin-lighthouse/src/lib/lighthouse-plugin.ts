import { Audit, AuditOutputs, Group, PluginConfig } from '@code-pushup/models';
import { filterByAuditSlug, filterBySlug } from '@code-pushup/utils';
import { AUDITS, GROUPS, LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import { validateOnlyAudits } from './utils';

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

  validateOnlyAudits(AUDITS, onlyAudits);
  const audits: Audit[] = filterBySlug(AUDITS, onlyAudits);
  const groups: Group[] = filterByAuditSlug(GROUPS, onlyAudits);

  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups,
    runner: (): AuditOutputs =>
      audits.map(audit => ({
        ...audit,
        score: 0,
        value: 0,
      })),
  };
}
