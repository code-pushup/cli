import { type Config } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { expect, vi } from 'vitest';
import {
  auditSchema,
  groupSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { LIGHTHOUSE_AUDITS, LIGHTHOUSE_GROUPS } from './constants';
import {
  LighthouseCliFlags,
  createRunnerFunction,
  lighthousePlugin,
} from './lighthouse-plugin';
import { getBudgets, getConfig, setLogLevel } from './utils';

vi.mock('./utils', async () => {
  // Import the actual 'lighthouse' module
  const actual = await vi.importActual('./utils');

  // Return the mocked module, merging the actual module with overridden parts
  return {
    ...actual,
    setLogLevel: vi.fn(),
    getBudgets: vi.fn().mockImplementation((path: string) => [{ path }]),
    getConfig: vi.fn(),
  };
});

vi.mock('lighthouse/cli/run.js', async () => {
  // Import the actual 'lighthouse' module
  const actual = await import('lighthouse/cli/run.js');
  // Define the mock implementation
  const mockRunLighthouse = vi.fn(
    (url: string, flags: LighthouseCliFlags, config: Config) =>
      url.includes('fail')
        ? undefined
        : {
            flags,
            config,
            lhr: {
              audits: {
                ['cumulative-layout-shift']: {
                  id: 'cumulative-layout-shift',
                  title: 'Cumulative Layout Shift',
                  description:
                    'Cumulative Layout Shift measures the movement of visible elements within the viewport.',
                  scoreDisplayMode: 'numeric',
                  numericValue: 1200,
                  displayValue: '1.2 s',
                  score: 0.9,
                } satisfies Result,
              },
            },
          },
  );

  // Return the mocked module, merging the actual module with overridden parts
  return {
    ...actual,
    runLighthouse: mockRunLighthouse, // Mock the default export if 'lighthouse' is imported as default
  };
});

describe('createRunnerFunction', () => {
  it('should return AuditOutputs if executed correctly', async () => {
    const runner = createRunnerFunction('https://localhost:8080');
    await expect(runner(undefined)).resolves.toEqual(
      expect.arrayContaining([
        {
          slug: 'cumulative-layout-shift',
          value: 1200,
          displayValue: '1.2 s',
          score: 0.9,
        },
      ]),
    );

    expect(setLogLevel).toHaveBeenCalledWith(
      expect.objectContaining({ verbose: false, quiet: false }),
    );
    expect(getBudgets).not.toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalledWith(expect.objectContaining({}));
  });

  it('should return verbose and quiet flags for logging', async () => {
    await createRunnerFunction('https://localhost:8080', {
      verbose: true,
      quiet: true,
    })(undefined);
    expect(setLogLevel).toHaveBeenCalledWith(
      expect.objectContaining({ verbose: true, quiet: true }),
    );
  });

  it('should return configPath', async () => {
    await createRunnerFunction('https://localhost:8080', {
      configPath: 'lh-config.js',
    })(undefined);
    expect(getConfig).toHaveBeenCalledWith(
      expect.objectContaining({ configPath: 'lh-config.js' }),
    );
  });

  it('should return budgets from the budgets object directly', async () => {
    await createRunnerFunction('https://localhost:8080', {
      budgets: [{ path: '*/xyz/' }],
    })(undefined);
    expect(getBudgets).not.toHaveBeenCalled();
    expect(runLighthouse).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ budgets: [{ path: '*/xyz/' }] }),
      undefined,
    );
  });

  it('should return budgets maintained in the file specified over budgetPath', async () => {
    await createRunnerFunction('https://localhost:8080', {
      budgetPath: 'lh-budgets.js',
    } as LighthouseCliFlags)(undefined);
    expect(getBudgets).toHaveBeenCalledWith('lh-budgets.js');
    expect(runLighthouse).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ budgets: [{ path: 'lh-budgets.js' }] }),
      undefined,
    );
  });

  it('should throw if lighthouse returns an empty result', async () => {
    const runner = createRunnerFunction('fail');
    await expect(runner(undefined)).rejects.toThrow(
      'Lighthouse did not produce a result.',
    );
  });
});

describe('lighthousePlugin-config-object', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com');
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits.length).toBeGreaterThan(0);
    expect(groups?.length).toBeGreaterThan(0);
  });

  it('should filter audits by onlyAudits string "first-contentful-paint"', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com', {
      onlyAudits: ['first-contentful-paint'],
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    expect(pluginConfig.audits[0]).toEqual(
      expect.objectContaining({
        slug: 'first-contentful-paint',
      }),
    );
  });

  it('should filter groups by onlyAudits string "first-contentful-paint"', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com', {
      onlyAudits: ['first-contentful-paint'],
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.groups).toHaveLength(1);

    const refs = pluginConfig.groups?.[0]?.refs;
    expect(refs).toHaveLength(1);

    expect(refs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'first-contentful-paint',
        }),
      ]),
    );
  });
});

describe('constants', () => {
  it.each(LIGHTHOUSE_AUDITS.map(a => [a.slug, a]))(
    'should parse audit "%s" correctly',
    (slug, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
      expect(audit.slug).toEqual(slug);
    },
  );

  it.each(LIGHTHOUSE_GROUPS.map(g => [g.slug, g]))(
    'should parse group "%s" correctly',
    (slug, group) => {
      expect(() => groupSchema.parse(group)).not.toThrow();
      expect(group.slug).toEqual(slug);
    },
  );
});
