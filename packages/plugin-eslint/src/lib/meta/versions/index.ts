import type { ESLintTarget } from '../../config';
import type { RuleData } from '../parse';
import { loadRulesForFlatConfig } from './flat';
import type { ConfigFormat } from './formats';
import { loadRulesForLegacyConfig } from './legacy';

export { detectConfigVersion } from './detect';

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
