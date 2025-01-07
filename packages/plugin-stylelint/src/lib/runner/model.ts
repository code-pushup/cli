import type { ConfigRuleSettings, Primary, Severity } from 'stylelint';

// Typing resource https://stylelint.io/user-guide/configure/
/** Config rule setting of Stylelint excluding null and undefined values */
export type ActiveConfigRuleSetting = Exclude<
  ConfigRuleSettings<Primary, Record<string, unknown>>,
  null | undefined
>;

/** Output of the `getNormalizedConfigForFile` function. Config file of Stylelint */
export type NormalizedStyleLintConfig = {
  config: {
    rules: Record<string, ConfigRuleSettings<Primary, Record<string, any>>>;
    defaultSeverity?: Severity;
  };
};
