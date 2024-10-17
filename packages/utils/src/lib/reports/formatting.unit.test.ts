import { describe, expect, it } from 'vitest';
import { toUnixPath } from '../transform';
import {
  formatFileLink,
  formatGitHubLink,
  formatGitLabLink,
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
    expect(formatSourceLine(position)).toBe(expected);
  });

  it('should return an empty string when the position is missing', () => {
    expect(formatSourceLine(undefined)).toBe('');
  });
});

describe('linkToLocalSourceForIde', () => {
  it('should not format the file path as a link when outputDir is undefined (VS Code)', () => {
    vi.stubEnv('TERM_PROGRAM', 'vscode');
    vi.stubEnv('GITHUB_ACTIONS', 'false');

    expect(
      linkToLocalSourceForIde({
        file: toUnixPath('packages/utils/src/index.ts'),
      }).toString(),
    ).toBe('`packages/utils/src/index.ts`');
  });

  it('should format the file path as a link when outputDir is defined (VS Code)', () => {
    vi.stubEnv('TERM_PROGRAM', 'vscode');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    const filePath = toUnixPath('packages/utils/src/index.ts');
    const outputDir = toUnixPath('.code-pushup');

    expect(
      linkToLocalSourceForIde({ file: filePath }, { outputDir }).toString(),
    ).toBe('[`packages/utils/src/index.ts`](../packages/utils/src/index.ts)');
  });

  it('should return a link to a specific line when startLine is provided (VS Code)', () => {
    vi.stubEnv('TERM_PROGRAM', 'vscode');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    const filePath = toUnixPath('packages/utils/src/index.ts');
    const outputDir = toUnixPath('.code-pushup');

    expect(
      linkToLocalSourceForIde(
        { file: filePath, position: { startLine: 2 } },
        { outputDir },
      ).toString(),
    ).toBe(
      '[`packages/utils/src/index.ts`](../packages/utils/src/index.ts#L2)',
    );
  });
});

describe('formatGitHubLink', () => {
  beforeEach(() => {
    vi.stubEnv('TERM_PROGRAM', '');
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    vi.stubEnv('GITHUB_SERVER_URL', 'https://github.com');
    vi.stubEnv('GITHUB_REPOSITORY', 'user/repo');
    vi.stubEnv('GITHUB_SHA', '1234567890abcdef');
  });

  it.each([
    [
      { startLine: 2 },
      'https://github.com/user/repo/blob/1234567890abcdef/src/index.ts#L2',
    ],
    [
      { startLine: 2, endLine: 5 },
      'https://github.com/user/repo/blob/1234567890abcdef/src/index.ts#L2-L5',
    ],
    [
      { startLine: 2, startColumn: 1 },
      'https://github.com/user/repo/blob/1234567890abcdef/src/index.ts#L2C1',
    ],
    [
      { startLine: 2, endLine: 2, startColumn: 1, endColumn: 5 },
      'https://github.com/user/repo/blob/1234567890abcdef/src/index.ts#L2C1-L2C5',
    ],
    [
      { startLine: 2, endLine: 5, startColumn: 1, endColumn: 6 },
      'https://github.com/user/repo/blob/1234567890abcdef/src/index.ts#L2C1-L5C6',
    ],
    [
      { startLine: 2, endLine: 2, startColumn: 1, endColumn: 1 },
      'https://github.com/user/repo/blob/1234567890abcdef/src/index.ts#L2C1',
    ],
  ])(
    'should generate a GitHub repository link for the file with position %o',
    (position, expected) => {
      expect(formatGitHubLink(toUnixPath('src/index.ts'), position)).toBe(
        expected,
      );
    },
  );

  it('should generate a GitHub repository link for the file when the position is undefined', () => {
    expect(formatGitHubLink(toUnixPath('src/index.ts'), undefined)).toBe(
      'https://github.com/user/repo/blob/1234567890abcdef/src/index.ts',
    );
  });
});

describe('formatGitLabLink', () => {
  beforeEach(() => {
    vi.stubEnv('TERM_PROGRAM', '');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('GITLAB_CI', 'true');
    vi.stubEnv('CI_SERVER_URL', 'https://gitlab.com');
    vi.stubEnv('CI_PROJECT_PATH', 'user/repo');
    vi.stubEnv('CI_COMMIT_SHA', '1234567890abcdef');
  });

  it.each([
    [
      { startLine: 2 },
      'https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts#L2',
    ],
    [
      { startLine: 2, endLine: 5 },
      'https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts#L2-5',
    ],
    [
      { startLine: 2, startColumn: 1 },
      'https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts#L2',
    ],
    [
      { startLine: 2, endLine: 2, startColumn: 1, endColumn: 5 },
      'https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts#L2',
    ],
    [
      { startLine: 2, endLine: 5, startColumn: 1, endColumn: 6 },
      'https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts#L2-5',
    ],
    [
      { startLine: 2, endLine: 2, startColumn: 1, endColumn: 1 },
      'https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts#L2',
    ],
  ])(
    'should generate a GitLab repository link for the file with position %o',
    (position, expected) => {
      expect(formatGitLabLink(toUnixPath('src/index.ts'), position)).toBe(
        expected,
      );
    },
  );

  it('should generate a GitLab repository link for the file when the position is undefined', () => {
    expect(formatGitLabLink(toUnixPath('src/index.ts'), undefined)).toBe(
      'https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts',
    );
  });
});

describe('formatFileLink', () => {
  it('should return a GitHub repository link when running in GitHub Actions', () => {
    vi.stubEnv('TERM_PROGRAM', '');
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    vi.stubEnv('GITHUB_SERVER_URL', 'https://github.com');
    vi.stubEnv('GITHUB_REPOSITORY', 'user/repo');
    vi.stubEnv('GITHUB_SHA', '1234567890abcdef');

    expect(
      formatFileLink(
        toUnixPath('src/index.ts'),
        { startLine: 2 },
        toUnixPath('.code-pushup'),
      ),
    ).toBe(
      `https://github.com/user/repo/blob/1234567890abcdef/src/index.ts#L2`,
    );
  });

  it('should return a GitLab repository link when running in GitLab CI/CD', () => {
    vi.stubEnv('TERM_PROGRAM', '');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('GITLAB_CI', 'true');
    vi.stubEnv('CI_SERVER_URL', 'https://gitlab.com');
    vi.stubEnv('CI_PROJECT_PATH', 'user/repo');
    vi.stubEnv('CI_COMMIT_SHA', '1234567890abcdef');

    expect(
      formatFileLink(
        toUnixPath('src/index.ts'),
        { startLine: 2 },
        toUnixPath('.code-pushup'),
      ),
    ).toBe(
      `https://gitlab.com/user/repo/-/blob/1234567890abcdef/src/index.ts#L2`,
    );
  });

  it.each([
    [{ startLine: 2 }, '../src/index.ts#L2'],
    [{ startLine: 2, endLine: 5 }, '../src/index.ts#L2'],
    [{ startLine: 2, startColumn: 1 }, '../src/index.ts#L2'],
  ])(
    'should transform the file path by including position %o when running in VS Code',
    (position, expected) => {
      vi.stubEnv('TERM_PROGRAM', 'vscode');
      vi.stubEnv('GITHUB_ACTIONS', 'false');
      expect(
        formatFileLink(
          toUnixPath('src/index.ts'),
          position,
          toUnixPath('.code-pushup'),
        ),
      ).toBe(expected);
    },
  );

  it('should return a relative file path when the position is undefined (VS Code)', () => {
    vi.stubEnv('TERM_PROGRAM', 'vscode');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    expect(
      formatFileLink(
        toUnixPath('src/index.ts'),
        undefined,
        toUnixPath('.code-pushup'),
      ),
    ).toBe('../src/index.ts');
  });

  it('should return a relative file path when the environment is neither VS Code nor GitHub, nor GitLab', () => {
    vi.stubEnv('TERM_PROGRAM', '');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('GITLAB_CI', 'false');
    expect(
      formatFileLink(
        toUnixPath('src/index.ts'),
        { startLine: 2, startColumn: 1 },
        toUnixPath('.code-pushup'),
      ),
    ).toBe('../src/index.ts');
  });
});
