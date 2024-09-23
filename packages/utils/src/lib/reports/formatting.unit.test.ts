import { describe, expect, it } from 'vitest';
import {
  formatFilePosition,
  formatSourceLine,
  linkToLocalSourceForIde,
  metaDescription,
  tableSection,
} from './formatting';

describe('tableSection', () => {
  it('should accept a title', () => {
    const sectionContent = tableSection({
      title: 'LCP Breakdown',
      rows: [[1]],
    })?.toString();
    expect(sectionContent).toMatch('#### LCP Breakdown\n\n');
  });

  it('should accept a title level', () => {
    const sectionContent = tableSection(
      {
        title: 'LCP Breakdown',
        rows: [[1]],
      },
      { level: 3 },
    )?.toString();
    expect(sectionContent).toMatch('### LCP Breakdown\n\n');
  });

  it('should return null for a table with empty rows', () => {
    expect(
      tableSection({
        title: 'LCP Breakdown',
        rows: [],
      }),
    ).toBeNull();
  });

  it('should render complete section', () => {
    expect(
      tableSection(
        {
          title: 'LCP Breakdown',
          columns: [
            { key: 'phase', label: 'Phase' },
            { key: 'percentageLcp', label: '% of LCP', align: 'left' },
            { key: 'timing', label: 'Timing', align: 'right' },
          ],
          rows: [
            {
              phase: 'TTFB',
              percentageLcp: '27%',
              timing: '620 ms',
            },
            {
              phase: 'Load Delay',
              percentageLcp: '25%',
              timing: '580 ms',
            },
            {
              phase: 'Load Time',
              percentageLcp: '41%',
              timing: '940 ms',
            },
            {
              phase: 'Render Delay',
              percentageLcp: '6%',
              timing: '140 ms',
            },
          ],
        },
        { level: 3 },
      )?.toString(),
    ).toMatchSnapshot();
  });
});

describe('metaDescription', () => {
  it('should return empty string if no options are given', () => {
    expect(metaDescription({}).toString()).toBe('');
  });

  it('should return description if only description is given', () => {
    expect(
      metaDescription({
        description: 'Audit to track bundle size',
      }).toString(),
    ).toBe('Audit to track bundle size');
  });

  it('should return docsUrl if only docsUrl is given', () => {
    expect(
      metaDescription({
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }).toString(),
    ).toBe('[📖 Docs](http://code-pushup.dev/audits/#lcp)');
  });

  it('should docs and description if both given', () => {
    expect(
      metaDescription({
        description: 'Audit for loading performance',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }).toString(),
    ).toBe(
      'Audit for loading performance [📖 Docs](http://code-pushup.dev/audits/#lcp)',
    );
  });

  it('should include additional empty lines if description ends with a code block', () => {
    expect(
      metaDescription({
        description: 'Audit to loading performance\n\n```\nfoo\n```\n',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }).toString(),
    ).toBe(
      'Audit to loading performance\n\n```\nfoo\n```\n\n[📖 Docs](http://code-pushup.dev/audits/#lcp)',
    );
  });
});

describe('formatSourceLine', () => {
  it.each([
    [{ startLine: 2 }, '2'],
    [{ startLine: 2, endLine: undefined }, '2'],
    [{ startLine: 2, endLine: 2 }, '2'],
    [{ startLine: 2, endLine: 3 }, '2-3'],
  ])('should format position %o as "%s"', (position, expected) => {
    expect(
      formatSourceLine({ file: '/packages/utils/src/index.ts', position }),
    ).toBe(expected);
  });

  it('should return an empty string when position is missing', () => {
    expect(formatSourceLine({ file: '/packages/utils/src/index.ts' })).toBe('');
  });
});

describe('linkToLocalSourceForIde', () => {
  it('should not format file path as link when outputDir is undefined', () => {
    expect(
      linkToLocalSourceForIde({
        file: '/packages/utils/src/index.ts',
      }).toString(),
    ).toBe('`/packages/utils/src/index.ts`');
  });

  it('should format file path as link when outputDir is provided', () => {
    expect(
      linkToLocalSourceForIde(
        { file: '/packages/utils/src/index.ts' },
        { outputDir: '/.code-pushup' },
      ).toString(),
    ).toBe('[`/packages/utils/src/index.ts`](../packages/utils/src/index.ts)');
  });

  it('should return link to specific line when startLine is provided (VS Code)', () => {
    vi.stubEnv('TERM_PROGRAM', 'vscode');
    expect(
      linkToLocalSourceForIde(
        {
          file: '/packages/utils/src/index.ts',
          position: { startLine: 2 },
        },
        { outputDir: '/.code-pushup' },
      ).toString(),
    ).toBe(
      '[`/packages/utils/src/index.ts`](../packages/utils/src/index.ts#L2)',
    );
    vi.unstubAllEnvs();
  });
});

describe('formatFilePosition', () => {
  it.each([
    ['../src/index.ts', { startLine: 2 }, '../src/index.ts#L2'],
    ['../src/index.ts', { startLine: 2, endLine: 5 }, '../src/index.ts#L2-L5'],
    ['../src/index.ts', { startLine: 2, startColumn: 1 }, '../src/index.ts#L2'],
  ])(
    'should transform file path "%s" by including position %o when running in GitHub',
    (file, position, expected) => {
      vi.stubEnv('GITHUB_ACTIONS', 'true');
      vi.stubEnv('TERM_PROGRAM', '');
      expect(formatFilePosition(file, position)).toBe(expected);
      vi.unstubAllEnvs();
    },
  );

  it('should return file path when position is undefined (GitHub)', () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    vi.stubEnv('TERM_PROGRAM', '');
    expect(formatFilePosition('../src/index.ts')).toBe('../src/index.ts');
    vi.unstubAllEnvs();
  });

  it.each([
    ['../src/index.ts', { startLine: 2 }, '../src/index.ts#L2'],
    ['../src/index.ts', { startLine: 2, endLine: 5 }, '../src/index.ts#L2'],
    ['../src/index.ts', { startLine: 2, startColumn: 1 }, '../src/index.ts#L2'],
  ])(
    'should transform file path "%s" by including position %o when running in VS Code',
    (file, position, expected) => {
      vi.stubEnv('TERM_PROGRAM', 'vscode');
      vi.stubEnv('GITHUB_ACTIONS', '');
      expect(formatFilePosition(file, position)).toBe(expected);
      vi.unstubAllEnvs();
    },
  );

  it('should return file path when position is undefined (VS Code)', () => {
    vi.stubEnv('TERM_PROGRAM', 'vscode');
    vi.stubEnv('GITHUB_ACTIONS', '');
    expect(formatFilePosition('../src/index.ts')).toBe('../src/index.ts');
    vi.unstubAllEnvs();
  });

  it('should return link to file when environment is neither VS Code nor GitHub', () => {
    vi.stubEnv('TERM_PROGRAM', '');
    vi.stubEnv('GITHUB_ACTIONS', '');
    expect(
      formatFilePosition('../src/index.ts', { startLine: 2, startColumn: 1 }),
    ).toBe('../src/index.ts');
    vi.unstubAllEnvs();
  });
});
