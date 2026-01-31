import {
  type CoveragePluginConfig,
  type CoverageType,
  coveragePluginConfigSchema,
} from './config.js';

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
        scoreTargets: 0.85,
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

  it('accepts number scoreTargets', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        reports: ['coverage/cli/lcov.info'],
        scoreTargets: 0.8,
      } satisfies CoveragePluginConfig),
    ).not.toThrow();
  });

  it('accepts object scoreTargets', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        reports: ['coverage/cli/lcov.info'],
        scoreTargets: { 'function-coverage': 0.9 },
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
    ).toThrow(String.raw`Invalid string: must include \"lcov\"`);
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

  it('throws for invalid score targets', () => {
    expect(() =>
      coveragePluginConfigSchema.parse({
        coverageTypes: ['line'],
        reports: ['coverage/cli/lcov.info'],
        scoreTargets: 1.1,
      } satisfies CoveragePluginConfig),
    ).toThrow('too_big');
  });
});
