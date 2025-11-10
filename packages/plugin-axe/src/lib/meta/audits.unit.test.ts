import { describe, expect, it } from 'vitest';
import { loadAxeRules, transformRulesToAudits } from './transform.js';

describe('transformRulesToAudits', () => {
  it.each([
    ['wcag21aa' as const, 65, 70],
    ['wcag22aa' as const, 66, 72],
    ['best-practice' as const, 25, 35],
    ['all' as const, 100, 110],
  ])(
    'should transform %j preset rules into audits within expected range',
    (preset, min, max) => {
      expect(transformRulesToAudits(loadAxeRules(preset))).toBeInRange(
        min,
        max,
      );
    },
  );

  it('should include required metadata fields for all transformed audits', () => {
    const audit = transformRulesToAudits(loadAxeRules('wcag21aa'))[0]!;

    expect(audit).toMatchObject({
      slug: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      docsUrl: expect.stringMatching(/^https:\/\//),
    });
  });
});
