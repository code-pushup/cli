import { describe, expect, it } from 'vitest';
import type { AxePreset } from '../config.js';
import { loadAxeRules, transformRulesToAudits } from './transform.js';

describe('transformRulesToAudits', () => {
  it.each<[AxePreset, number, number]>([
    ['wcag21aa', 65, 70],
    ['wcag22aa', 66, 72],
    ['best-practice', 25, 35],
    ['all', 100, 110],
  ])(
    'should transform %j preset rules into audits within expected range',
    async (preset, min, max) => {
      const rules = await loadAxeRules(preset);
      expect(transformRulesToAudits(rules)).toBeInRange(min, max);
    },
  );

  it('should include required metadata fields for all transformed audits', async () => {
    const rules = await loadAxeRules('wcag21aa');
    const audit = transformRulesToAudits(rules)[0]!;

    expect(audit).toMatchObject({
      slug: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      docsUrl: expect.stringMatching(/^https:\/\//),
    });
  });
});
