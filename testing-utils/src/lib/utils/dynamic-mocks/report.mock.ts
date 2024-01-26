import { Report, reportSchema } from '@code-pushup/models';
import { categoryConfigsMock } from './categories.mock';
import { eslintPluginReportMock } from './eslint-plugin.mock';
import { lighthousePluginReportMock } from './lighthouse-plugin.mock';

export function reportWithCategoriesMock(): Report {
  return reportSchema.parse({
    packageName: '@code-pushup/core',
    version: '0.0.1',
    date: '2023-10-18T07:49:45.506Z',
    duration:
      eslintPluginReportMock().duration +
      lighthousePluginReportMock().duration +
      50,
    categories: categoryConfigsMock(),
    plugins: [eslintPluginReportMock(), lighthousePluginReportMock()],
  });
}
