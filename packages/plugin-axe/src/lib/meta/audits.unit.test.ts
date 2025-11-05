import { describe, expect, it } from 'vitest';
import type { Audit } from '@code-pushup/models';
import { loadAxeRules, transformRulesToAudits } from './transform.js';

describe('transformRulesToAudits', () => {
  describe('wcag21aa preset', () => {
    it('should return approximately 67 audits', () => {
      const audits = transformRulesToAudits(loadAxeRules('wcag21aa'));

      expect(audits.length).toBeGreaterThanOrEqual(65);
      expect(audits.length).toBeLessThanOrEqual(70);
    });
  });

  describe('wcag22aa preset', () => {
    it('should return approximately 68 audits', () => {
      const audits = transformRulesToAudits(loadAxeRules('wcag22aa'));

      expect(audits.length).toBeGreaterThanOrEqual(66);
      expect(audits.length).toBeLessThanOrEqual(72);
    });
  });

  describe('best-practice preset', () => {
    it('should return approximately 30 audits', () => {
      const audits = transformRulesToAudits(loadAxeRules('best-practice'));

      expect(audits.length).toBeGreaterThanOrEqual(25);
      expect(audits.length).toBeLessThanOrEqual(35);
    });
  });

  describe('all preset', () => {
    it('should return approximately 104 audits', () => {
      const audits = transformRulesToAudits(loadAxeRules('all'));

      expect(audits.length).toBeGreaterThanOrEqual(100);
      expect(audits.length).toBeLessThanOrEqual(110);
    });
  });

  describe('audit structure', () => {
    it('should have slug, title, description, and docsUrl', () => {
      const audit = transformRulesToAudits(
        loadAxeRules('wcag21aa'),
      )[0] as Audit;

      expect(audit.slug).toBeTruthy();
      expect(audit.title).toBeTruthy();
      expect(audit.description).toBeTruthy();
      expect(audit.docsUrl).toMatch(/^https:\/\//);
    });
  });
});
