import { capitalize, pluginMetaLogFormatter } from '@code-pushup/utils';
import type { CoverageType } from './config.js';
import { COVERAGE_PLUGIN_TITLE } from './constants.js';

export const formatMetaLog = pluginMetaLogFormatter(COVERAGE_PLUGIN_TITLE);

export function typeToAuditSlug(type: CoverageType): string {
  return `${type}-coverage`;
}

export function typeToAuditTitle(type: CoverageType): string {
  return `${capitalize(type)} coverage`;
}

export function slugToTitle(slug: string): string {
  return capitalize(slug.split('-').join(' '));
}
