import {describe, expect, it} from "vitest";
import {mockCategory, mockConfig, mockPluginConfig, mockRunnerOutput} from "./implementation/helpers.mock";
import {coreConfigSchema} from "./core-config";
import {runnerOutputAuditRefsPresentInPluginConfigs} from "./output";

describe('CoreConfig', () => {

  /*
  CategoryConfig:
    - category slugs are unique
    - the slug in metric is unique within the CategoryConfig.metrics
    - plugin exists with that ref
      - audit exists with that ref
    - group exists with that ref
      - audit exists with that ref
   */
  describe('CategoryConfig', () => {

    it('should parse if configuration is valid', () => {
      const cfg = mockConfig({pluginSlug: 'test', auditSlug: ['a', 'b']});
      cfg.categories.push(mockCategory({auditRef: ['test#a', 'test#b']}));
      expect(() => coreConfigSchema.parse(cfg)).not.toThrow();
    });

    it('should throw if the audit ref in a metric is not unique within the metrics', () => {
      const cfg = mockConfig({pluginSlug: 'test', auditSlug: ['a', 'b']});
      const duplicatedSlug = 'test';
      cfg.categories.push(mockCategory({categorySlug: 'test', auditRef: ['test#a']}));
      cfg.categories.push(mockCategory({categorySlug: 'test', auditRef: ['test#b']}));
      expect(() => coreConfigSchema.parse(cfg))
        .toThrow(`In the categories, the following slugs are duplicated: ${duplicatedSlug}`);
    });

    it('should throw if audit refs are not unique', () => {
      const cfg = mockConfig({pluginSlug: 'test', auditSlug: ['a', 'b']});
      const duplicatedSlug = 'test#a';
      cfg.categories.push(mockCategory({categorySlug: 'test', auditRef: [duplicatedSlug, duplicatedSlug]}));
      expect(() => coreConfigSchema.parse(cfg))
        .toThrow(`In the categories, the following audit ref's are duplicates: ${duplicatedSlug}`);
    });

    it('should throw if ref in a category does not exist in plugins', () => {
      const cfg = mockConfig({pluginSlug: 'test', auditSlug: ['a', 'b']});
      const missingSlug = 'missing-plugin-slug-in-category#auditref';
      cfg.categories.push(mockCategory({categorySlug: 'test', auditRef: [`${missingSlug}`]}));
      expect(() => coreConfigSchema.parse(cfg))
        .toThrow(`In the categories, the following plugin ref's do not exist in the provided plugins: ${missingSlug}`);
    });

    it('should throw if ref in a category does not exist in groups', () => {
      const cfg = mockConfig({pluginSlug: 'test', auditSlug: ['a', 'b'], groupSlug: 'groups:test#a'});
      const missingSlug = 'groups:missing-plugin-slug-in-category#auditref';
      cfg.categories.push(mockCategory({categorySlug: 'test', auditRef: [`${missingSlug}`]}));
      expect(() => coreConfigSchema.parse(cfg))
        .toThrow(`In the categories, the following plugin ref's do not exist in the provided plugins: ${missingSlug}`);
    });

  });

  /*
  PluginConfigGroup
  - the ref points to an exists audit slug
  */
  describe('PluginConfigGroup', () => {

    it('should parse if group is valid', () => {
      const cfg = mockConfig({pluginSlug: 'test', auditSlug: ['a', 'b']});
      cfg.categories.push(mockCategory({auditRef: ['test#a', 'test#b']}));
      expect(() => coreConfigSchema.parse(cfg)).not.toThrow();
    });

    it('should throw if group does not point to an audit', () => {
      const cfg = mockConfig({pluginSlug: 'test', auditSlug: ['a', 'b']});
      const missingRef = 'test#p';
      cfg.categories.push(mockCategory({auditRef: ['test#b', missingRef]}));
      expect(() => coreConfigSchema.parse(cfg))
        .toThrow(`In the categories, the following plugin ref's do not exist in the provided plugins: ${missingRef}`);
    });

  });

  /*
  RunnerOutput
  - each audit result should contain a valid slug of some audit provided during initialization
    - this is always checked within the context of the given plugin
   */
  describe('RunnerOutput', () => {
    it('should pass if output audits are valid', () => {
      const plugin = mockPluginConfig({pluginSlug: 'test', auditSlug:['a']});
      const out = mockRunnerOutput({auditSlug: 'test#a'});
      expect(runnerOutputAuditRefsPresentInPluginConfigs(out, plugin)).toBe(true);
    });

    it('should throw if output audits are not in config', () => {
      const plugin = mockPluginConfig({pluginSlug: 'test', auditSlug:['a']});
      const out = mockRunnerOutput({auditSlug: 'test#b'});
      expect(runnerOutputAuditRefsPresentInPluginConfigs(out, plugin)).toEqual(['test#b']);
    });
  });

});
