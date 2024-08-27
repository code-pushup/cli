import { describe, expect, it } from 'vitest';
import {
  type CoveragePluginConfig,
  type CoverageType,
  coveragePluginConfigSchema,
} from './config';

describe('coveragePluginConfigSchema', () => {
  it('accepts a code coverage configuration with all entities', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageTypes: ['branch', 'function'],
        reports: [
          {
            resultsPath: 'coverage/cli/lcov.info',
            pathToProject: 'packages/cli',
          },
        ],
        coverageToolCommand: {
          command: 'npx nx run-many',
          args: ['-t', 'test', '--coverage'],
        },
        perfectScoreThreshold: 0.85,
      } satisfies CoveragePluginConfig),
    ).not.toThrow();
  });

  it('accepts a minimal code coverage configuration', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        reports: ['coverage/cli/lcov.info'],
      } satisfies CoveragePluginConfig),
    ).not.toThrow();
  });

  it('replaces undefined coverage with all available types', () => {
    const config = {
      reports: ['coverage/cli/lcov.info'],
    } satisfies CoveragePluginConfig;
    expect(() => coveragePluginConfigSchema.parse(config)).not.toThrow();

    const { coverageTypes } = coveragePluginConfigSchema.parse(config);
    expect(coverageTypes).toEqual<CoverageType[]>([
      'function',
      'branch',
      'line',
    ]);
  });

  it('throws for empty coverage type array', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageTypes: [],
        reports: ['coverage/cli/lcov.info'],
      } satisfies CoveragePluginConfig),
    ).toThrow('too_small');
  });

  it('throws for no report', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageTypes: ['branch'],
        reports: [],
      } satisfies CoveragePluginConfig),
    ).toThrow('too_small');
  });

  it('throws for unsupported report format', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageTypes: ['line'],
        reports: ['coverage/cli/coverage-final.json'],
      } satisfies CoveragePluginConfig),
    ).toThrow(/Invalid input: must include.+lcov/);
  });

  it('throws for missing command', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageTypes: ['line'],
        reports: ['coverage/cli/lcov.info'],
        coverageToolCommand: {
          args: ['npx', 'nx', 'run-many', '-t', 'test', '--coverage'],
        },
      }),
    ).toThrow('invalid_type');
  });

  it('throws for invalid score threshold', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageTypes: ['line'],
        reports: ['coverage/cli/lcov.info'],
        perfectScoreThreshold: 1.1,
      } satisfies CoveragePluginConfig),
    ).toThrow('too_big');
  });
});
