import type { Linter, Rule } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { exists, findNearestFile, logger, toArray } from '@code-pushup/utils';
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
      const meta = findRuleMeta(rule.id, configs);
      if (!meta) {
        logger.warn(`Cannot find metadata for rule ${rule.id}`);
        return null;
      }
      return { ...rule, meta };
    })
    .filter(exists);
}

type FlatConfig = Linter.Config | Linter.Config[];

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

async function loadConfigByPath(configPath: string): Promise<FlatConfig> {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);
  const url = pathToFileURL(absolutePath).toString();
  const mod = (await import(url)) as FlatConfig | { default: FlatConfig };
  return 'default' in mod ? mod.default : mod;
}

function findEnabledRulesWithOptions(
  configs: Linter.Config[],
): Omit<RuleData, 'meta'>[] {
  const enabledRules = configs
    .flatMap(({ rules }) => Object.entries(rules ?? {}))
    .filter(([, entry]) => entry != null && !isRuleOff(entry))
    .map(([id, entry]) => ({
      id,
      options: entry ? optionsFromRuleEntry(entry) : [],
    }));
  const uniqueRulesMap = new Map(
    enabledRules.map(({ id, options }) => [
      `${id}::${jsonHash(options)}`,
      { id, options },
    ]),
  );
  return [...uniqueRulesMap.values()];
}

function findRuleMeta(
  ruleId: string,
  configs: Linter.Config[],
): Rule.RuleMetaData | undefined {
  const { plugin, name } = parseRuleId(ruleId);
  if (!plugin) {
    return findBuiltinRuleMeta(name);
  }
  return findPluginRuleMeta(plugin, name, configs);
}

function findBuiltinRuleMeta(name: string): Rule.RuleMetaData | undefined {
  const rule = builtinRules.get(name);
  return rule?.meta;
}

function findPluginRuleMeta(
  plugin: string,
  name: string,
  configs: Linter.Config[],
): Rule.RuleMetaData | undefined {
  const config = configs.find(({ plugins = {} }) => plugin in plugins);
  const rule = config?.plugins?.[plugin]?.rules?.[name];

  if (typeof rule === 'function') {
    logger.warn(
      `Cannot parse metadata for rule ${plugin}/${name}, plugin registers it as a function`,
    );
    return undefined;
  }

  return rule?.meta;
}
