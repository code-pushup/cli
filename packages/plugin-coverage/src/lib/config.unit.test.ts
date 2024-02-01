import { describe, expect, it } from 'vitest';
import { CoveragePluginConfig, coveragePluginConfigSchema } from './config';

describe('coveragePluginConfigSchema', () => {
  it('accepts a code coverage configuration with all entities', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageType: ['branch', 'function'],
        reports: ['coverage/cli/lcov.info'],
        coverageToolCommand: {
          command: 'npx nx run-many',
          args: ['-t', 'test', '--coverage'],
        },
        perfectScoreThreshold: 85,
      } satisfies CoveragePluginConfig),
    ).not.toThrow();
  });

  it('accepts a minimal code coverage configuration', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageType: ['line'],
        reports: ['coverage/cli/lcov.info'],
      } satisfies CoveragePluginConfig),
    ).not.toThrow();
  });

  it('throws for no coverage type', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageType: [],
        reports: ['coverage/cli/lcov.info'],
      } satisfies CoveragePluginConfig),
    ).toThrow('too_small');
  });

  it('throws for no report', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageType: ['branch'],
        reports: [],
      } satisfies CoveragePluginConfig),
    ).toThrow('too_small');
  });

  it('throws for unsupported report format', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageType: ['line'],
        reports: ['coverage/cli/coverage-final.json'],
      }),
    ).toThrow(/Invalid input: must include.+lcov/);
  });

  it('throws for missing command', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageType: ['line'],
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
        coverageType: ['line'],
        reports: ['coverage/cli/lcov.info'],
        perfectScoreThreshold: 110,
      } satisfies CoveragePluginConfig),
    ).toThrow('too_big');
  });
});
