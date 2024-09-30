import {
  COMMIT_ALT_MOCK,
  COMMIT_MOCK,
  reportsDiffAddedPluginMock,
  reportsDiffAltMock,
  reportsDiffChangedMock,
  reportsDiffMock,
  reportsDiffUnchangedMock,
} from '@code-pushup/test-utils';
import {
  generateMdReportsDiff,
  generateMdReportsDiffForMonorepo,
} from './generate-md-reports-diff';

describe('generateMdReportsDiff', () => {
  it('should format Markdown comment for improved reports diff', async () => {
    await expect(generateMdReportsDiff(reportsDiffMock())).toMatchFileSnapshot(
      '__snapshots__/report-diff-improved.md',
    );
  });

  it('should format Markdown comment for mixed reports diff', async () => {
    await expect(
      generateMdReportsDiff(reportsDiffAltMock()),
    ).toMatchFileSnapshot('__snapshots__/report-diff-mixed.md');
  });

  it('should format Markdown comment for minimal reports diff', async () => {
    await expect(
      generateMdReportsDiff({
        ...reportsDiffMock(),
        categories: { changed: [], unchanged: [], added: [], removed: [] },
        groups: { changed: [], unchanged: [], added: [], removed: [] },
        audits: {
          changed: [
            {
              slug: 'npm-outdated',
              title: 'Check for outdates NPM packages',
              plugin: { slug: 'npm', title: 'NPM' },
              scores: { before: 0.9, after: 0.7, diff: -0.2 },
              values: { before: 1, after: 3, diff: 2 },
              displayValues: {
                before: '1 package is out of date',
                after: '3 packages are out of date',
              },
            },
          ],
          unchanged: [],
          added: [],
          removed: [],
        },
      }),
    ).toMatchFileSnapshot('__snapshots__/report-diff-minimal.md');
  });

  it('should format Markdown comment for unchanged reports diff', async () => {
    await expect(
      generateMdReportsDiff(reportsDiffUnchangedMock()),
    ).toMatchFileSnapshot('__snapshots__/report-diff-unchanged.md');
  });

  it('should format Markdown comment for reports diff with changes that do not impact score', async () => {
    await expect(
      generateMdReportsDiff(reportsDiffChangedMock()),
    ).toMatchFileSnapshot('__snapshots__/report-diff-changed.md');
  });

  it('should format Markdown comment for reports diff with added plugin', async () => {
    await expect(
      generateMdReportsDiff(reportsDiffAddedPluginMock()),
    ).toMatchFileSnapshot('__snapshots__/report-diff-added.md');
  });

  it('should format Markdown comment with link to portal', async () => {
    await expect(
      generateMdReportsDiff({
        ...reportsDiffAltMock(),
        portalUrl: `https://app.code-pushup.dev/portal/dunder-mifflin/website/comparison/${COMMIT_MOCK.hash}/${COMMIT_ALT_MOCK.hash}`,
      }),
    ).toMatchFileSnapshot('__snapshots__/report-diff-with-portal.md');
  });

  it('should format Markdown comment with truncated audits table', async () => {
    await expect(
      generateMdReportsDiff({
        ...reportsDiffMock(),
        categories: { changed: [], unchanged: [], added: [], removed: [] },
        groups: { changed: [], unchanged: [], added: [], removed: [] },
        audits: {
          changed: Array.from({ length: 123 }).map((_, i) => {
            const id = i + 1;
            const failing = (i % 10) + 1;
            return {
              slug: `test-suite-${id}`,
              title: `Test suite #${id}`,
              plugin: { slug: 'e2e', title: 'E2E tests' },
              values: { before: 0, after: failing, diff: failing },
              scores: { before: 1, after: 0, diff: -1 },
              displayValues: { before: 'passed', after: `${failing} failed` },
            };
          }),
          unchanged: [],
          added: [],
          removed: [],
        },
      }),
    ).toMatchFileSnapshot('__snapshots__/report-diff-many-audits.md');
  });
});

describe('generateMdReportsDiffForMonorepo', () => {
  it('should format Markdown comment with multiple projects', async () => {
    await expect(
      generateMdReportsDiffForMonorepo([
        { ...reportsDiffMock(), label: 'console' },
        { ...reportsDiffAltMock(), label: 'admin' },
        { ...reportsDiffUnchangedMock(), label: 'marketing' },
        { ...reportsDiffAddedPluginMock(), label: 'docs' },
      ]),
    ).toMatchFileSnapshot('__snapshots__/report-diff-monorepo.md');
  });

  it('should format Markdown comment with multiple projects and portal links', async () => {
    await expect(
      generateMdReportsDiffForMonorepo([
        {
          ...reportsDiffMock(),
          label: 'frontoffice',
          portalUrl: `https://app.code-pushup.dev/portal/dunder-mifflin/frontoffice/comparison/${COMMIT_MOCK.hash}/${COMMIT_ALT_MOCK.hash}`,
        },
        {
          ...reportsDiffUnchangedMock(),
          label: 'backoffice',
          portalUrl: `https://app.code-pushup.dev/portal/dunder-mifflin/backoffice/comparison/${COMMIT_MOCK.hash}/${COMMIT_ALT_MOCK.hash}`,
        },
      ]),
    ).toMatchFileSnapshot('__snapshots__/report-diff-monorepo-with-portal.md');
  });

  it('should format Markdown comment with all projects unchanged', async () => {
    await expect(
      generateMdReportsDiffForMonorepo([
        { ...reportsDiffUnchangedMock(), label: 'frontoffice' },
        { ...reportsDiffUnchangedMock(), label: 'backoffice' },
      ]),
    ).toMatchFileSnapshot('__snapshots__/report-diff-monorepo-unchanged.md');
  });

  it('should format Markdown comment with changes that do not impact score', async () => {
    await expect(
      generateMdReportsDiffForMonorepo([
        { ...reportsDiffChangedMock(), label: 'web' },
      ]),
    ).toMatchFileSnapshot('__snapshots__/report-diff-monorepo-changed.md');
  });
});
