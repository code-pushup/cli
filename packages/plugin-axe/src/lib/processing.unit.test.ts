import { describe, expect, it } from 'vitest';
import { processAuditsAndGroups } from './processing';

describe('processAuditsAndGroups', () => {
  it('should return audits and groups without expansion for single URL', () => {
    const { audits, groups } = processAuditsAndGroups(
      ['https://example.com'],
      'wcag21aa',
    );

    expect(audits.length).toBeGreaterThan(0);
    expect(groups.length).toBeGreaterThan(0);

    expect(audits[0]?.slug).not.toContain('-1');
    expect(groups[0]?.slug).not.toContain('-1');
  });

  it('should expand audits and groups for multiple URLs', () => {
    const { audits, groups } = processAuditsAndGroups(
      ['https://example.com', 'https://another-example.com'],
      'wcag21aa',
    );

    expect(audits.length).toBeGreaterThan(0);
    expect(groups.length).toBeGreaterThan(0);

    expect(audits[0]?.slug).toContain('-1');
    expect(groups[0]?.slug).toContain('-1');

    expect(audits[0]?.title).toContain('(example.com)');
    expect(groups[0]?.title).toContain('(example.com)');
  });
});
