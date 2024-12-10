import type { Linter, Rule } from 'eslint';
// eslint-disable-next-line import/no-deprecated
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { exists, findNearestFile, toArray, ui } from '@code-pushup/utils';
import type { ESLintTarget } from '../../config.js';
import { jsonHash } from '../hash.js';
import {
  type RuleData,
  isRuleOff,
  optionsFromRuleEntry,
  parseRuleId,
} from '../parse.js';

export async function loadRulesForFlatConfig({
  eslintrc,
}: Pick<ESLintTarget, 'eslintrc'>): Promise<RuleData[]> {
  const config = eslintrc
    ? await loadConfigByPath(eslintrc)
    : await loadConfigByDefaultLocation();
  const configs = toArray(config);

  const rules = findEnabledRulesWithOptions(configs);
  return rules
    .map(rule => {
      const meta = findRuleMeta(rule.ruleId, configs);
      if (!meta) {
        ui().logger.warning(`Cannot find metadata for rule ${rule.ruleId}`);
        return null;
      }
      return { ...rule, meta };
    })
    .filter(exists);
}

type FlatConfig = Linter.FlatConfig | Linter.FlatConfig[];

async function loadConfigByDefaultLocation(): Promise<FlatConfig> {
  const flatConfigFileNames = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
  ];
  const configPath = await findNearestFile(flatConfigFileNames);
  if (configPath) {
    return loadConfigByPath(configPath);
  }
  throw new Error(
    [
      `ESLint config file not found - expected ${flatConfigFileNames.join('/')} in ${process.cwd()} or some parent directory`,
      'If your ESLint config is in a non-standard location, use the `eslintrc` parameter to specify the path.',
    ].join('\n'),
  );
}

async function loadConfigByPath(path: string): Promise<FlatConfig> {
  const absolutePath = isAbsolute(path) ? path : join(process.cwd(), path);
  const url = pathToFileURL(absolutePath).toString();
  const mod = (await import(url)) as FlatConfig | { default: FlatConfig };
  return 'default' in mod ? mod.default : mod;
}

function findEnabledRulesWithOptions(
  configs: Linter.FlatConfig[],
): Omit<RuleData, 'meta'>[] {
  const enabledRules = configs
    .flatMap(({ rules }) => Object.entries(rules ?? {}))
    .filter(([, entry]) => entry != null && !isRuleOff(entry))
    .map(([ruleId, entry]) => ({
      ruleId,
      options: entry ? optionsFromRuleEntry(entry) : [],
    }));
  const uniqueRulesMap = new Map(
    enabledRules.map(({ ruleId, options }) => [
      `${ruleId}::${jsonHash(options)}`,
      { ruleId, options },
    ]),
  );
  return [...uniqueRulesMap.values()];
}

function findRuleMeta(
  ruleId: string,
  configs: Linter.FlatConfig[],
): Rule.RuleMetaData | undefined {
  const { plugin, name } = parseRuleId(ruleId);
  if (!plugin) {
    return findBuiltinRuleMeta(name);
  }
  return findPluginRuleMeta(plugin, name, configs);
}

function findBuiltinRuleMeta(name: string): Rule.RuleMetaData | undefined {
  // eslint-disable-next-line import/no-deprecated, deprecation/deprecation
  const rule = builtinRules.get(name);
  return rule?.meta;
}

function findPluginRuleMeta(
  plugin: string,
  name: string,
  configs: Linter.FlatConfig[],
): Rule.RuleMetaData | undefined {
  const config = configs.find(({ plugins = {} }) => plugin in plugins);
  const rule = config?.plugins?.[plugin]?.rules?.[name];

  if (typeof rule === 'function') {
    ui().logger.warning(
      `Cannot parse metadata for rule ${plugin}/${name}, plugin registers it as a function`,
    );
    return undefined;
  }

  return rule?.meta;
}
