import type { ESLintTarget } from '../../config';
import type { RuleData } from '../parse';
import type { ConfigFormat } from './formats';
import { loadRulesForLegacyConfig } from './legacy';

export { detectConfigVersion } from './detect';

export function selectRulesLoader(
  version: ConfigFormat,
): (target: ESLintTarget) => Promise<RuleData[]> {
  switch (version) {
    case 'flat':
    // TODO: implement loader for flat config
    case 'legacy':
      return loadRulesForLegacyConfig;
  }
}
