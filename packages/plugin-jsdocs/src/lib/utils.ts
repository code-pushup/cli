import type { Audit, Group } from '@code-pushup/models';
import type { JsDocsPluginTransformedConfig } from './config.js';
import { AUDITS_MAP } from './constants.js';

/**
 * Get audits based on the configuration.
 * If no audits are specified, return all audits.
 * If audits are specified, return only the specified audits.
 * @param config - The configuration object.
 * @returns The audits.
 */
export function filterAuditsByPluginConfig(
  config: Pick<JsDocsPluginTransformedConfig, 'onlyAudits' | 'skipAudits'>,
): Audit[] {
  const { onlyAudits, skipAudits } = config;

  if (onlyAudits && onlyAudits.length > 0) {
    return Object.values(AUDITS_MAP).filter(audit =>
      onlyAudits.includes(audit.slug),
    );
  }

  if (skipAudits && skipAudits.length > 0) {
    return Object.values(AUDITS_MAP).filter(
      audit => !skipAudits.includes(audit.slug),
    );
  }

  return Object.values(AUDITS_MAP);
}

/**
 * Filter groups by the audits that are specified in the configuration.
 * The groups refs are filtered to only include the audits that are specified in the configuration.
 * @param groups - The groups to filter.
 * @param options - The configuration object containing either onlyAudits or skipAudits.
 * @returns The filtered groups.
 */
export function filterGroupsByOnlyAudits(
  groups: Group[],
  options: Pick<JsDocsPluginTransformedConfig, 'onlyAudits' | 'skipAudits'>,
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
