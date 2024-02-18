import { AuditReport } from '@code-pushup/models';

export const LIGHTHOUSE_AUDIT_REPORTS_MAP: Record<string, AuditReport> = {
  'first-contentful-paint': {
    slug: 'first-contentful-paint',
    title: 'First Contentful Paint',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/',
    score: 0.76,
    value: 1189,
    displayValue: '1.2 s',
  },
  'largest-contentful-paint': {
    slug: 'largest-contentful-paint',
    title: 'Largest Contentful Paint',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/',
    score: 0.81,
    value: 1491,
    displayValue: '1.5 s',
  },
  'total-blocking-time': {
    slug: 'total-blocking-time',
    title: 'Total Blocking Time',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/',
    score: 1,
    value: 0,
    displayValue: '0 ms',
  },
  'cumulative-layout-shift': {
    slug: 'cumulative-layout-shift',
    title: 'Cumulative Layout Shift',
    docsUrl: 'https://web.dev/cls/',
    score: 1,
    value: 0,
    displayValue: '0',
  },
  'speed-index': {
    slug: 'speed-index',
    title: 'Speed Index',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/speed-index/',
    score: 0.93,
    value: 1189,
    displayValue: '1.2 s',
  },
};
