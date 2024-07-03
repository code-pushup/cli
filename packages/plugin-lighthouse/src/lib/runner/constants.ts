import {
  type CliFlags,
  type Config,
  type IcuMessage,
  type Audit as LHAudit,
  defaultConfig,
} from 'lighthouse';
import { join } from 'node:path';
import type { Audit, Group } from '@code-pushup/models';
import { LIGHTHOUSE_OUTPUT_PATH } from '../constants';

const { audits, categories } = defaultConfig;

// internal intermediate variable to derive the relevant audits
const allRawLighthouseAudits = await Promise.all(
  (audits ?? []).map(loadLighthouseAudit),
);

export const PLUGIN_SLUG = 'lighthouse';
export const LIGHTHOUSE_NAVIGATION_AUDITS: Audit[] = allRawLighthouseAudits
  // This plugin only supports the "navigation" mode of Lighthouse in the current implementation
  // If we don't exclude other audits we throw in the plugin output validation as some of the provided audits are not included in `lighthouse-report.json`
  .filter(
    audit =>
      audit.meta.supportedModes == null ||
      (Array.isArray(audit.meta.supportedModes) &&
        audit.meta.supportedModes.includes('navigation')),
  )
  .map(audit => ({
    slug: audit.meta.id,
    title: getMetaString(audit.meta.title),
    description: getMetaString(audit.meta.description),
  }));

const navigationAuditSlugs = new Set(
  LIGHTHOUSE_NAVIGATION_AUDITS.map(({ slug }) => slug),
);
export const LIGHTHOUSE_GROUPS: Group[] = Object.entries(categories ?? {}).map(
  ([id, category]) => ({
    slug: id,
    title: getMetaString(category.title),
    ...(category.description && {
      description: getMetaString(category.description),
    }),
    refs: category.auditRefs
      .filter(({ id: auditSlug }) => navigationAuditSlugs.has(auditSlug))
      .map(ref => ({
        slug: ref.id,
        weight: ref.weight,
      })),
  }),
);

function getMetaString(value: string | IcuMessage): string {
  if (typeof value === 'string') {
    return value;
  }
  return value.formattedDefault;
}

async function loadLighthouseAudit(
  value: Config.AuditJson,
): Promise<typeof LHAudit> {
  // the passed value directly includes the implementation as JS object
  //   shape: { implementation: typeof LHAudit; options?: {}; }
  if (typeof value === 'object' && 'implementation' in value) {
    return value.implementation;
  }
  // the passed value is a `LH.Audit` class instance
  //   shape: LHAudit
  if (typeof value === 'function') {
    return value;
  }
  // the passed value is the path directly
  //   shape: string
  // otherwise it is a JS object maintaining a `path` property
  //   shape: { path: string, options?: {}; }
  const path = typeof value === 'string' ? value : value.path;
  const module = (await import(`lighthouse/core/audits/${path}.js`)) as {
    default: typeof LHAudit;
  };
  return module.default;
}

export const LIGHTHOUSE_REPORT_NAME = 'lighthouse-report.json';

export const DEFAULT_CLI_FLAGS = {
  // default values extracted from
  // https://github.com/GoogleChrome/lighthouse/blob/7d80178c37a1b600ea8f092fc0b098029799a659/cli/cli-flags.js#L80
  verbose: false,
  saveAssets: false,
  // needed to pass CI on linux and windows (locally it works without headless too)
  chromeFlags: ['--headless=shell'],
  port: 0,
  hostname: '127.0.0.1',
  view: false,
  channel: 'cli',
  // custom overwrites in favour of the plugin
  // hide logs by default
  quiet: true,
  onlyAudits: [],
  skipAudits: [],
  onlyCategories: [],
  output: ['json'],
  outputPath: join(LIGHTHOUSE_OUTPUT_PATH, LIGHTHOUSE_REPORT_NAME),
} satisfies Partial<CliFlags>;
