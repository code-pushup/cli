import type { Audit, Group } from '@code-pushup/models';
import type { DocCoveragePluginConfig } from './config';
import { AUDITS_MAP } from './constants';

/**
 * Get audits based on the configuration.
 * If no audits are specified, return all audits.
 * If audits are specified, return only the specified audits.
 * @param config - The configuration object.
 * @returns The audits.
 */
export function filterAuditsByPluginConfig(
  config: Pick<DocCoveragePluginConfig, 'onlyAudits'>,
): Audit[] {
  const { onlyAudits } = config;

  if (!onlyAudits || onlyAudits.length === 0) {
    return Object.values(AUDITS_MAP);
  }

  return Object.values(AUDITS_MAP).filter(audit =>
    onlyAudits.includes(audit.slug),
  );
}

/**
 * Filter groups by the audits that are specified in the configuration.
 * The groups refs are filtered to only include the audits that are specified in the configuration.
 * @param groups - The groups to filter.
 * @param options - The configuration object.
 * @returns The filtered groups.
 */
export function filterGroupsByOnlyAudits(
  groups: Group[],
  options: Pick<DocCoveragePluginConfig, 'onlyAudits'>,
): Group[] {
  const audits = filterAuditsByPluginConfig(options);
  return groups
    .map(group => ({
      ...group,
      refs: group.refs.filter(ref =>
        audits.some(audit => audit.slug === ref.slug),
      ),
    }))
    .filter(group => group.refs.length > 0);
}
