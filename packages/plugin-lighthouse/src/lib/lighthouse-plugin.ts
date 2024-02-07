import { Audit, AuditOutputs, Group, PluginConfig } from '@code-pushup/models';
import {
  filterAuditsBySlug,
  filterGroupsByAuditSlug,
} from '@code-pushup/utils';
import { AUDITS, GROUPS, LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import { validateOnlyAudits } from './utils';

export type LighthousePluginOptions = {
  url: string;
  outputPath?: string;
  onlyAudits?: string | string[];
  verbose?: boolean;
  headless?: boolean;
  userDataDir?: string;
};

export function lighthousePlugin(
  options: LighthousePluginOptions,
): PluginConfig {
  const { onlyAudits = [] } = options;

  validateOnlyAudits(AUDITS, onlyAudits);
  const audits: Audit[] = filterAuditsBySlug(AUDITS, onlyAudits);
  const groups: Group[] = filterGroupsByAuditSlug(GROUPS, onlyAudits);

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
