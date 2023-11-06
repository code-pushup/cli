import { Report, reportSchema } from '../../src';
import { categoryConfigs } from './categories.mock';
import { eslintPluginReport } from './eslint-plugin.mock';
import { lighthousePluginReport } from './lighthouse-plugin.mock';

export function report(): Report {
  return reportSchema.parse({
    packageName: '@code-pushup/core',
    version: '0.0.1',
    date: '2023-10-18T07:49:45.506Z',
    duration:
      eslintPluginReport().duration + lighthousePluginReport().duration + 50,
    categories: categoryConfigs(),
    plugins: [eslintPluginReport(), lighthousePluginReport()],
  });
}
