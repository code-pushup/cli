import type { AuditSummary } from './types.js';
import { summaryStatsFromVulnerabilities } from './utils.js';

describe('summaryStatsFromVulnerabilities', () => {
  it('should count severity occurences and total', () => {
    expect(
      summaryStatsFromVulnerabilities([
        { severity: 'high' },
        { severity: 'moderate' },
        { severity: 'low' },
        { severity: 'moderate' },
        { severity: 'high' },
      ]),
    ).toEqual({
      critical: 0,
      high: 2,
      moderate: 2,
      low: 1,
      info: 0,
      total: 5,
    } satisfies AuditSummary);
  });
});
