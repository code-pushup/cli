import { describe, expect, it } from 'vitest';
import {
  type CoverageType,
  type StylelintPluginConfig,
  stylelintPluginConfigSchema,
} from './config.js';

describe('stylelintPluginConfigSchema', () => {
  it('accepts a code stylelint configuration with all entities', () => {
    expect(() =>
      stylelintPluginConfigSchema.parse({
        stylelintTypes: ['branch', 'function'],
        reports: [
          {
            resultsPath: 'stylelint/cli/lcov.info',
            pathToProject: 'packages/cli',
          },
        ],
        stylelintToolCommand: {
          command: 'npx nx run-many',
          args: ['-t', 'test', '--stylelint'],
        },
        perfectScoreThreshold: 0.85,
      } satisfies StylelintPluginConfig),
    ).not.toThrow();
  });

  it('accepts a minimal code stylelint configuration', () => {
    expect(() =>
      stylelintPluginConfigSchema.parse({
        reports: ['stylelint/cli/lcov.info'],
      } satisfies StylelintPluginConfig),
    ).not.toThrow();
  });

  it('replaces undefined stylelint with all available types', () => {
    const config = {
      reports: ['stylelint/cli/lcov.info'],
    } satisfies StylelintPluginConfig;
    expect(() => stylelintPluginConfigSchema.parse(config)).not.toThrow();

    const { stylelintTypes } = stylelintPluginConfigSchema.parse(config);
    expect(stylelintTypes).toEqual<CoverageType[]>([
      'function',
      'branch',
      'line',
    ]);
  });

  it('throws for empty stylelint type array', () => {
    expect(() =>
      stylelintPluginConfigSchema.parse({
        stylelintTypes: [],
        reports: ['stylelint/cli/lcov.info'],
      } satisfies StylelintPluginConfig),
    ).toThrow('too_small');
  });

  it('throws for no report', () => {
    expect(() =>
      stylelintPluginConfigSchema.parse({
        stylelintTypes: ['branch'],
        reports: [],
      } satisfies StylelintPluginConfig),
    ).toThrow('too_small');
  });

  it('throws for unsupported report format', () => {
    expect(() =>
      stylelintPluginConfigSchema.parse({
        stylelintTypes: ['line'],
        reports: ['stylelint/cli/stylelint-final.json'],
      } satisfies StylelintPluginConfig),
    ).toThrow(/Invalid input: must include.+lcov/);
  });

  it('throws for missing command', () => {
    expect(() =>
      stylelintPluginConfigSchema.parse({
        stylelintTypes: ['line'],
        reports: ['stylelint/cli/lcov.info'],
        stylelintToolCommand: {
          args: ['npx', 'nx', 'run-many', '-t', 'test', '--stylelint'],
        },
      }),
    ).toThrow('invalid_type');
  });

  it('throws for invalid score threshold', () => {
    expect(() =>
      stylelintPluginConfigSchema.parse({
        stylelintTypes: ['line'],
        reports: ['stylelint/cli/lcov.info'],
        perfectScoreThreshold: 1.1,
      } satisfies StylelintPluginConfig),
    ).toThrow('too_big');
  });
});
