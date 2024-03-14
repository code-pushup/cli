import {
  reportsDiffAddedPluginMock,
  reportsDiffAltMock,
  reportsDiffMock,
  reportsDiffUnchangedMock,
} from '@code-pushup/test-utils';
import { generateMdReportsDiff } from './generate-md-reports-diff';

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

  it('should format Markdown comment for reports diff with added plugin', async () => {
    await expect(
      generateMdReportsDiff(reportsDiffAddedPluginMock()),
    ).toMatchFileSnapshot('__snapshots__/report-diff-added.md');
  });
});
