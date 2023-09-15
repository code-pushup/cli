import {
  mockCategory,
  mockConfig,
  mockPluginConfig,
  mockReport,
} from './schema-helper.mock';

const pluginSlug = ['plg-0', 'plg-1', 'plg-2'];
const auditSlug0 = ['0a', '0b', '0c', '0d'];
const auditSlug1 = ['1a', '1b', '1c'];
const auditSlug2 = ['2a', '2b', '2c', '2d', '2e'];

export const dummyConfig = mockConfig({ outputPath: 'out' });
dummyConfig.plugins = [
  mockPluginConfig({ pluginSlug: pluginSlug[0], auditSlug: auditSlug0 }),
  mockPluginConfig({ pluginSlug: pluginSlug[1], auditSlug: auditSlug1 }),
  mockPluginConfig({ pluginSlug: pluginSlug[2], auditSlug: auditSlug2 }),
];

dummyConfig.categories = [
  mockCategory({
    pluginSlug: pluginSlug[0],
    categorySlug: 'performance',
    auditSlug: auditSlug0,
  }) /*,
  mockCategory({
    pluginSlug: pluginSlug[1],
    categorySlug: 'a11y',
    auditSlug: auditSlug1,
  }),
  mockCategory({
    pluginSlug: pluginSlug[2],
    categorySlug: 'seo',
    auditSlug: auditSlug2,
  }),*/,
];

export const dummyReport = mockReport({
  pluginSlug: pluginSlug[0],
  auditSlug: auditSlug0,
});
