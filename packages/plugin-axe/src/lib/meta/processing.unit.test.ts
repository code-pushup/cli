import { describe, expect, it } from 'vitest';
import { processAuditsAndGroups } from './processing.js';

describe('processAuditsAndGroups', () => {
  it('should return audits and groups without expansion when analyzing single URL', async () => {
    const { audits, groups } = await processAuditsAndGroups(
      ['https://example.com'],
      'wcag21aa',
    );

    expect(audits).not.toBeEmpty();
    expect(groups).not.toBeEmpty();

    expect(audits[0]!.slug).not.toContain('-1');
    expect(groups[0]!.slug).not.toContain('-1');
  });

  it('should expand audits and groups when analyzing multiple URLs', async () => {
    const { audits, groups } = await processAuditsAndGroups(
      ['https://example.com', 'https://another-example.com'],
      'wcag21aa',
    );

    expect(audits).not.toBeEmpty();
    expect(groups).not.toBeEmpty();

    expect(audits[0]!.slug).toContain('-1');
    expect(groups[0]!.slug).toContain('-1');

    expect(audits[0]!.title).toContain('(example.com)');
    expect(groups[0]!.title).toContain('(example.com)');
  });
});
