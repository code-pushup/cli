import {expect, vi} from 'vitest';
import {
  auditSchema,
  groupSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import {AUDITS, GROUPS} from './constants';
import {getRunner, lighthousePlugin} from './lighthouse-plugin';
import {Result} from "lighthouse/types/lhr/audit-result";

vi.mock('lighthouse', async () => {
  // Import the actual 'lighthouse' module
  const actual = await import('lighthouse').then(m => m);
  // Define the mock implementation
  const mockLighthouse = vi.fn((url: string) => {
    return url.includes('fail') ? undefined : {
      lhr: {
        audits: {
            ['cumulative-layout-shift']: {
              id: 'cumulative-layout-shift',
              title: 'title',
              description: 'description',
              scoreDisplayMode: 'numeric',
              numericValue: 1200,
              displayValue: '1.2 s',
              score: 0.9,
            } satisfies Result
          }
      },
    };
  });

  // Return the mocked module, merging the actual module with overridden parts
  return {
    ...actual,
    default: mockLighthouse, // Mock the default export if 'lighthouse' is imported as default
  };
});

describe('getRunner', () => {
  it('should return AuditOutputs if executed correctly', () => {
      const runner = getRunner('https://localhost:8080');
      expect(runner(() => void 0)).resolves.toEqual(expect.arrayContaining([{
        slug: 'cumulative-layout-shift',
        value: 1200,
        displayValue: '1.2 s',
        score: 0.9,
      }]));
    },
  );

  it('should throw if lighthouse returns an empty result', () => {
      const runner = getRunner('fail');
      expect(runner(() => void 0)).rejects.toThrow('Lighthouse did not produce a result.');
    },
  );
});

describe('lighthousePlugin-config-object', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = lighthousePlugin('https://code-pushup-portal.com');
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.audits.length).toBeGreaterThan(0);
    expect(pluginConfig.groups?.length).toBeGreaterThan(0);
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
  it.each(AUDITS.map(a => [a.slug, a]))(
    'should parse audit "%s" correctly',
    (slug, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
      expect(audit.slug).toEqual(slug);
    },
  );

  it.each(GROUPS.map(g => [g.slug, g]))(
    'should parse group "%s" correctly',
    (slug, group) => {
      expect(() => groupSchema.parse(group)).not.toThrow();
      expect(group.slug).toEqual(slug);
    },
  );
});
