import type { Report } from '@code-pushup/models';
import { COMMIT_ALT_MOCK, COMMIT_MOCK } from '../commit.mock';
import { categoryConfigsMock } from './categories.mock';
import {
  eslintPluginReportAltMock,
  eslintPluginReportMock,
} from './eslint-plugin.mock';
import {
  lighthousePluginReportAltMock,
  lighthousePluginReportMock,
} from './lighthouse-plugin.mock';

export function reportMock(): Report {
  return {
    packageName: '@code-pushup/core',
    version: '0.0.1',
    date: '2023-10-18T07:49:45.506Z',
    duration:
      eslintPluginReportMock().duration +
      lighthousePluginReportMock().duration +
      50,
    commit: COMMIT_MOCK,
    categories: categoryConfigsMock(),
    plugins: [eslintPluginReportMock(), lighthousePluginReportMock()],
  };
}

export function reportAltMock(): Report {
  return {
    ...reportMock(),
    date: '2024-03-12T12:42:05.370Z',
    duration:
      eslintPluginReportAltMock().duration +
      lighthousePluginReportAltMock().duration +
      20,
    commit: COMMIT_ALT_MOCK,
    plugins: [eslintPluginReportAltMock(), lighthousePluginReportAltMock()],
  };
}
