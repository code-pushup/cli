import { describe, expect, it } from 'vitest';
import {
  type AuditReport,
  type PluginReport,
  type Report,
  auditReportSchema,
  pluginReportSchema,
  reportSchema,
} from './report.js';

describe('auditReportSchema', () => {
  it('should accept a valid audit report with all entities', () => {
    expect(() =>
      auditReportSchema.parse({
        slug: 'vitest',
        title: 'Vitest',
        score: 0.9,
        value: 90,
        displayValue: '90 %',
        description: 'Vitest unit tests',
        docsUrl: 'https://vitest.dev/',
        details: {
          issues: [
            {
              message: 'expected to throw an error "invalid_type"',
              severity: 'error',
            },
          ],
        },
      } satisfies AuditReport),
    ).not.toThrow();
  });

  it('should accept a minimal audit report', () => {
    expect(() =>
      auditReportSchema.parse({
        slug: 'no-any',
        title: 'Do not use any',
        score: 1,
        value: 0,
      } satisfies AuditReport),
    ).not.toThrow();
  });

  it('should throw for a missing score', () => {
    expect(() =>
      auditReportSchema.parse({
        slug: 'cummulative-layout-shift',
        title: 'Cummulative layout shift',
        value: 500,
      }),
    ).toThrow('invalid_type');
  });

  it('should throw for score outside 0-1 range', () => {
    expect(() =>
      auditReportSchema.parse({
        slug: 'no-magic-numbers',
        title: 'Do not use magic numbers',
        value: 2,
        score: -20,
      } satisfies AuditReport),
    ).toThrow('too_small');
  });
});

describe('pluginReportSchema', () => {
  it('should accept a plugin report with all entities', () => {
    expect(() =>
      pluginReportSchema.parse({
        slug: 'cli-report',
        title: 'Code PushUp CLI report',
        icon: 'npm',
        date: '2024-01-11T11:00:00.000Z',
        duration: 100_000,
        audits: [
          {
            slug: 'collect',
            title: 'CLI main branch report',
            score: 0.93,
            value: 93,
          },
          {
            slug: 'perf-collect',
            title: 'CLI performance branch report',
            score: 0.82,
            value: 82,
          },
        ],
        groups: [
          {
            slug: 'perf',
            title: 'Performance metrics',
            refs: [{ slug: 'perf-collect', weight: 1 }],
          },
        ],
        description: 'Code PushUp CLI',
        docsUrl: 'https://github.com/code-pushup/cli/wiki',
        packageName: 'code-pushup/core',
        version: '1.0.1',
      } satisfies PluginReport),
    ).not.toThrow();
  });

  it('should accept a minimal plugin report', () => {
    expect(() =>
      pluginReportSchema.parse({
        slug: 'cypress',
        title: 'Cypress',
        icon: 'cypress',
        date: '2024-01-11T11:00:00.000Z',
        duration: 123_000,
        audits: [
          {
            slug: 'cyct',
            title: 'Component tests',
            score: 0.96,
            value: 96,
          },
        ],
      } satisfies PluginReport),
    ).not.toThrow();
  });

  it('should throw for a plugin report with no audit outputs', () => {
    expect(() =>
      pluginReportSchema.parse({
        slug: 'cypress',
        title: 'Cypress',
        icon: 'cypress',
        date: '2024-01-11T11:00:00.000Z',
        duration: 123_000,
        audits: [],
      } satisfies PluginReport),
    ).toThrow('too_small');
  });

  it('should throw for a group reference without audits mention', () => {
    expect(() =>
      pluginReportSchema.parse({
        slug: 'lighthouse',
        title: 'Lighthouse',
        icon: 'lighthouse',
        date: '2024-01-12T10:00:00.000Z',
        duration: 200,
        audits: [
          {
            slug: 'speed-index',
            title: 'Speed index',
            score: 0.87,
            value: 600,
          },
        ],
        groups: [
          {
            slug: 'perf',
            title: 'Performance metrics',
            refs: [{ slug: 'perf-lighthouse', weight: 1 }],
          },
        ],
      } satisfies PluginReport),
    ).toThrow(
      String.raw`Group references audits which don't exist in this plugin: \"perf-lighthouse\"`,
    );
  });
});

describe('reportSchema', () => {
  it('should accept a valid report with all entities', () => {
    expect(() =>
      reportSchema.parse({
        categories: [
          {
            refs: [
              {
                plugin: 'vitest',
                slug: 'vitest-unit-test',
                type: 'audit',
                weight: 3,
              },
            ],
            slug: 'bug-prevention',
            title: 'Bug prevention',
          },
        ],
        commit: {
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          message: 'Minor fixes',
          author: 'John Doe',
          date: new Date('2024-01-07T09:15:00.000Z'),
        },
        date: '2024-01-07T09:30:00.000Z',
        duration: 600,
        plugins: [
          {
            audits: [
              { score: 0, slug: 'vitest-unit-test', title: '', value: 0 },
            ],
            date: '',
            duration: 0,
            icon: 'vitest',
            slug: 'vitest',
            title: 'Vitest',
            packageName: 'cli',
            version: 'v0.5.2',
          },
        ],
        packageName: 'cli',
        version: '1.0.1',
      } satisfies Report),
    ).not.toThrow();
  });

  it('should throw for a report with no plugins', () => {
    expect(() =>
      reportSchema.parse({
        date: '2024-01-03T08:00:00.000Z',
        duration: 14_500,
        packageName: 'cli',
        version: '1.0.1',
        plugins: [],
      }),
    ).toThrow('too_small');
  });

  it('should throw for a non-existent category reference', () => {
    expect(() =>
      reportSchema.parse({
        categories: [
          {
            refs: [
              {
                plugin: 'vitest',
                slug: 'vitest-unit-test',
                type: 'audit',
                weight: 3,
              },
            ],
            slug: 'bug-prevention',
            title: 'Bug prevention',
          },
        ],
        commit: null,
        date: '2024-01-07T09:30:00.000Z',
        duration: 600,
        plugins: [
          {
            audits: [
              {
                score: 0,
                slug: 'vitest-integration-test',
                title: '',
                value: 0,
              },
            ],
            date: '2024-01-07T09:30:00.000Z',
            duration: 450,
            icon: 'vitest',
            slug: 'vitest',
            title: 'Vitest',
            packageName: 'cli',
            version: 'v0.5.2',
          },
        ],
        packageName: 'cli',
        version: '1.0.1',
      } satisfies Report),
    ).toThrow(
      String.raw`Category references audits or groups which don't exist: audit \"vitest-unit-test\" (plugin \"vitest\")`,
    );
  });
});
