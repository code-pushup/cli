import { CoreConfig } from '../../src';
import {
  mockCategory,
  mockCoreConfig,
  mockPluginConfig,
  mockReport,
} from '../schema.mock';

const pluginSlug = ['plg-0', 'plg-1', 'plg-2'];
const auditSlug0 = ['0a', '0b', '0c', '0d'];
const auditSlug1 = ['1a', '1b', '1c'];
const auditSlug2 = ['2a', '2b', '2c', '2d', '2e'];

const dummyPlugins = [
  mockPluginConfig({ pluginSlug: pluginSlug[0], auditSlug: auditSlug0 }),
  mockPluginConfig({ pluginSlug: pluginSlug[1], auditSlug: auditSlug1 }),
  mockPluginConfig({ pluginSlug: pluginSlug[2], auditSlug: auditSlug2 }),
];

const dummyCategories = [
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

export const dummyConfig = (outputPath = 'tmp'): CoreConfig => ({
  ...mockCoreConfig({ outputPath }),
  plugins: dummyPlugins,
  categories: dummyCategories,
});

export const dummyReport = mockReport({
  pluginSlug: pluginSlug[0],
  auditSlug: auditSlug0,
});
dummyReport.categories = dummyCategories;
