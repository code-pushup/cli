import type { ESLintTarget } from '../../config.js';
import type { RuleData } from '../parse.js';
import { loadRulesForFlatConfig } from './flat.js';
import type { ConfigFormat } from './formats.js';
import { loadRulesForLegacyConfig } from './legacy.js';

export { detectConfigVersion } from './detect.js';
export type { ConfigFormat } from './formats.js';

export function selectRulesLoader(
  version: ConfigFormat,
): (target: ESLintTarget) => Promise<RuleData[]> {
  switch (version) {
    case 'flat':
      return loadRulesForFlatConfig;
    case 'legacy':
      return loadRulesForLegacyConfig;
  }
}
