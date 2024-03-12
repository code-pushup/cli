import { AuditReport } from '@code-pushup/models';

export const LIGHTHOUSE_AUDITS_CHANGES: Partial<
  Record<
    keyof typeof LIGHTHOUSE_AUDITS_MAP,
    Pick<AuditReport, 'score' | 'value' | 'displayValue'>
  >
> = {
  'largest-contentful-paint': {
    score: 0.85,
    value: 1369,
    displayValue: '1.4 s',
  },
  'first-contentful-paint': {
    score: 0.79,
    value: 1146,
    displayValue: '1.1 s',
  },
  'speed-index': {
    score: 0.94,
    value: 1146,
    displayValue: '1.1 s',
  },
};

export const LIGHTHOUSE_AUDITS_MAP = {
  'first-contentful-paint': {
    slug: 'first-contentful-paint',
    title: 'First Contentful Paint',
    description:
      'First Contentful Paint marks the time at which the first text or image is painted.',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/',
    score: 0.76,
    value: 1189,
    displayValue: '1.2 s',
  },
  'largest-contentful-paint': {
    slug: 'largest-contentful-paint',
    title: 'Largest Contentful Paint',
    description:
      'Largest Contentful Paint marks the time at which the largest text or image is painted.',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/',
    score: 0.81,
    value: 1491,
    displayValue: '1.5 s',
  },
  'total-blocking-time': {
    slug: 'total-blocking-time',
    title: 'Total Blocking Time',
    description:
      'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds.',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/',
    score: 1,
    value: 0,
    displayValue: '0 ms',
  },
  'cumulative-layout-shift': {
    slug: 'cumulative-layout-shift',
    title: 'Cumulative Layout Shift',
    description:
      'Cumulative Layout Shift measures the movement of visible elements within the viewport.',
    docsUrl: 'https://web.dev/cls/',
    score: 1,
    value: 0,
    displayValue: '0',
  },
  'speed-index': {
    slug: 'speed-index',
    title: 'Speed Index',
    description:
      'Speed Index shows how quickly the contents of a page are visibly populated.',
    docsUrl:
      'https://developer.chrome.com/docs/lighthouse/performance/speed-index/',
    score: 0.93,
    value: 1189,
    displayValue: '1.2 s',
  },
} satisfies Record<string, AuditReport>;

export const LIGHTHOUSE_AUDIT_SLUGS = Object.keys(
  LIGHTHOUSE_AUDITS_MAP,
) as (keyof typeof LIGHTHOUSE_AUDITS_MAP)[];
