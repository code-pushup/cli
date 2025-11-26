import ansis from 'ansis';
import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { AUDITS, GROUPS } from './constants.js';
import { typescriptPlugin } from './typescript-plugin.js';

describe('typescriptPlugin', () => {
  it('should create valid plugin config without options', () => {
    const pluginConfig = typescriptPlugin();

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(AUDITS.length);
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(GROUPS.length);
  });

  it('should create valid plugin config', () => {
    const pluginConfig = typescriptPlugin({
      tsconfig: 'mocked-away/tsconfig.json',
      onlyAudits: ['syntax-errors', 'semantic-errors', 'configuration-errors'],
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(3);
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(2);
  });

  it('should throw for invalid valid params', () => {
    expect(() =>
      typescriptPlugin({
        // @ts-expect-error testing invalid argument type
        tsconfig: 42,
      }),
    )
      .toThrow(`Error parsing TypeScript Plugin options: SchemaValidationError: Invalid ${ansis.bold('TypescriptPluginConfig')}
✖ Invalid input: expected string, received number
  → at tsconfig
`);
  });

  it('should pass scoreTargets to PluginConfig when provided', () => {
    const scoreTargets = { 'no-implicit-any-errors': 0.9 };
    const pluginConfig = typescriptPlugin({
      scoreTargets,
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.scoreTargets).toStrictEqual(scoreTargets);
  });
});
