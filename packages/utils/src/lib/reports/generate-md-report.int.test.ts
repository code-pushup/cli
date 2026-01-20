import { reportMock } from '@code-pushup/test-fixtures';
import { generateMdReport } from './generate-md-report.js';
import { scoreReport } from './scoring.js';
import { sortReport } from './sorting.js';

describe('generateMdReport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2021-09-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should contain all sections when using the fixture report', async () => {
    const mdReport = generateMdReport(sortReport(scoreReport(reportMock())));
    expect(mdReport).toContain('🏷 Category');
    await expect(mdReport).toMatchFileSnapshot('__snapshots__/report.md');
  });
});
