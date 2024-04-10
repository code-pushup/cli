import {
  type CliFlags,
  type Config,
  type IcuMessage,
  Audit as LHAudit,
  defaultConfig,
} from 'lighthouse';
import { Audit, Group } from '@code-pushup/models';

export const LIGHTHOUSE_PLUGIN_SLUG = 'lighthouse';
export const LIGHTHOUSE_REPORT_NAME = 'lighthouse-report.json';

const { audits, categories } = defaultConfig;

export const LIGHTHOUSE_GROUPS: Group[] = Object.entries(categories ?? {}).map(
  ([id, category]) => ({
    slug: id,
    title: getMetaString(category.title),
    ...(category.description && {
      description: getMetaString(category.description),
    }),
    refs: category.auditRefs.map(ref => ({ slug: ref.id, weight: ref.weight })),
  }),
);

export const LIGHTHOUSE_AUDITS: Audit[] = await Promise.all(
  (audits ?? []).map(async value => {
    const audit = await loadLighthouseAudit(value);
    return {
      slug: audit.meta.id,
      title: getMetaString(audit.meta.title),
      description: getMetaString(audit.meta.description),
    };
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

export const DEFAULT_CLI_FLAGS: Partial<CliFlags> = {
  // default values extracted from
  // https://github.com/GoogleChrome/lighthouse/blob/7d80178c37a1b600ea8f092fc0b098029799a659/cli/cli-flags.js#L80
  verbose: false,
  quiet: false,
  saveAssets: false,
  // needed to pass CI on linux and windows (locally it works without headless too)
  chromeFlags: '--headless=shell',
  port: 0,
  hostname: '127.0.0.1',
  view: false,
  channel: 'cli',
  chromeIgnoreDefaultFlags: false,
  // custom overwrites in favour of the plugin
  output: ['json'],
  outputPath: LIGHTHOUSE_REPORT_NAME,
};
