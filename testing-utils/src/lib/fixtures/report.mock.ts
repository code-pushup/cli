import { type Report } from '../../../../packages/models/src';

export const MINIMAL_REPORT_MOCK = {
  packageName: '@code-pushup/core',
  version: '0.0.1',
  date: '2023-08-16T09:00:00.000Z',
  duration: 666,
  categories: [],
  plugins: [],
} satisfies Report;
