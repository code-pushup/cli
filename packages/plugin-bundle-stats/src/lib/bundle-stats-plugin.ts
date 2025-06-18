import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { PluginConfig } from '@code-pushup/models';
import { formatBytes, truncateText } from '@code-pushup/utils';
import { unifyEsbuild, unifyRsbuild, unifyWebpack } from './unify.js';
import { type BundleStatsConfig, filterUnifiedTreeByConfig } from './utils.js';

/* ---------- 🔧 tiny helpers ---------- */

const PKG = createRequire(import.meta.url)('../../package.json');
const LIMIT = { warn: 5e5, err: 1e6, file: 5e4 }; // bytes
const IC: Record<string, string> = {
  'entry-point': '🚪',
  'import-statement': '📥',
  'import-side-effect': '⚡',
  'import-specifier': '🔗',
  'import-default': '📌',
  'import-namespace': '🌐',
  'dynamic-import': '🔄',
  'require-call': '📋',
  'require-resolve': '🔍',
  'import-rule': '🎨',
  'url-token': '🖼️',
  'asset-import': '📎',
  'export-import': '📤',
  'extract-css': '🎨',
  'context-element': '🧩',
  'hot-module': '🔥',
  delegated: '🤝',
};
const UNIFY = {
  esbuild: unifyEsbuild,
  webpack: unifyWebpack,
  rsbuild: unifyRsbuild,
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const short = (p: string) =>
  truncateText(p.replace(process.cwd(), '⟨CWD⟩'), { maxChars: 80 });
const bytes = (n: any): number => parseInt(n?.values?.bytes || 0, 10);

/* icon from node name / type */
const icon = (n: any): string => {
  const t: string = String(n.name ?? '');
  const type: string = String(n.values?.type ?? '');
  if (Object.prototype.hasOwnProperty.call(IC, type)) return IC[type] as string;
  if (['outputs', 'inputs'].includes(t)) return '📦';
  if (t.includes('chunk-') && t.endsWith('.js')) return '🗂️';
  if (t.endsWith('.ts')) return '📘';
  if (/\.m?js$/.test(t)) return '📄';
  if (t.includes('node_modules')) return '📚';
  if (t.includes('packages/')) return '📁';
  return '🛡️';
};

/* limit + sort children, promoting outputs at root */
function prune(node: any, max = 5, d = 0, maxD = 2, promote = true): any {
  const head = {
    ...node,
    name: `${icon(node)} ${short(node.name)}`,
    values: bytes(node)
      ? { displayBytes: formatBytes(bytes(node)) }
      : undefined,
  };
  if (d >= maxD || !node.children?.length) return head;

  let kids = node.children;
  if (promote && d === 0) {
    kids = kids.find((c: any) => c.name === 'outputs')?.children || [];
    promote = false; // only once
  }
  kids = kids
    .filter((c: any) => c.name !== 'inputs')
    .sort((a: any, b: any) => bytes(b) - bytes(a))
    .slice(0, max)
    .map((c: any) => prune(c, max, d + 1, maxD, promote));

  return { ...head, children: kids };
}

type IssueSeverity = 'info' | 'warning' | 'error';
interface Issue {
  severity: IssueSeverity;
  message: string;
  source: { file: string };
}

/* bundle-wide + per-file issue list */
const issues = (total: number, conf: BundleStatsConfig, tree: any): Issue[] => {
  const out: Issue[] = [],
    fn = short(conf.name);
  const add = (s: IssueSeverity, m: string) =>
    out.push({ severity: s, message: m, source: { file: fn } });
  if (!total) add('info', 'No matching files found.');
  else if (total < LIMIT.warn) {
    if (total < 1024) add('info', `Very small bundle (${formatBytes(total)})`);
  } else if (total > LIMIT.err)
    add('error', `Bundle >1 MB (${formatBytes(total)})`);
  else add('warning', `Large bundle (${formatBytes(total)})`);

  tree.root.children
    ?.find((c: any) => c.name === 'outputs')
    ?.children?.filter((f: any) => bytes(f) > LIMIT.file)
    .forEach((f: any) =>
      add(
        'warning',
        `Large file ${short(f.name).split('/').pop()} (${formatBytes(bytes(f))})`,
      ),
    );
  return out;
};

/* ---------- 🚀 plugin ---------- */

export async function bundleStatsPlugin(opts: {
  artefact: string;
  bundler: keyof typeof UNIFY;
  configs: BundleStatsConfig[];
}): Promise<PluginConfig> {
  const stats = JSON.parse(await readFile(opts.artefact, 'utf8'));
  const unify = UNIFY[opts.bundler];
  if (!unify) throw new Error(`Unsupported bundler: ${opts.bundler}`);

  const unified = unify(stats);
  const trees = filterUnifiedTreeByConfig(unified, opts.configs);

  return {
    slug: 'bundle-stats',
    packageName: PKG.name,
    version: PKG.version,
    title: 'Bundle Stats',
    icon: 'folder-rules',
    description: 'Official Code PushUp Bundle Stats plugin.',
    docsUrl: 'https://npm.im/@code-pushup/bundle-stats-plugin',
    audits: opts.configs.map(c => ({
      slug: slug(c.name),
      title: c.name,
      description: `Bundle analysis for ${c.name}`,
      ...(c.thresholds ? { thresholds: c.thresholds } : {}),
    })),
    runner: async () =>
      trees.map((t, i) => {
        const cfg = opts.configs[i];
        if (!cfg) throw new Error(`Missing config for tree index ${i}`);
        const outputs = t.root.children?.find(
          (c: any) => c.name === 'outputs',
        )?.children;
        const total = outputs && outputs.length > 0 ? bytes(outputs[0]) : 0;
        const issueList = issues(total, cfg, t) || [];

        // Default: pass = 1, warn = 0.5, orange = 0.3, fail = 0
        let score = 1;
        // If thresholds.percent or thresholds.bytes is set, use them for scoring
        if (cfg.thresholds?.percent) {
          const percent = total / (cfg.thresholds.percent * 1024 * 1024); // percent of threshold in MB
          if (percent > 0.9) score = 1;
          else if (percent > 0.5) score = 0.5;
          else if (percent > 0.3) score = 0.3;
          else if (percent > 0) score = 0;
        } else if (cfg.thresholds?.bytes) {
          const percent = total / cfg.thresholds.bytes;
          if (percent > 0.9) score = 1;
          else if (percent > 0.5) score = 0.5;
          else if (percent > 0.3) score = 0.3;
          else if (percent > 0) score = 0;
        } else {
          if (issueList.some(issue => issue.severity === 'error')) score = 0;
          else if (issueList.some(issue => issue.severity === 'warning'))
            score = 0.5;
        }
        return {
          slug: slug(cfg.name),
          score,
          value: total,
          displayValue: formatBytes(total),
          details: {
            issues: issueList.length > 0 ? issueList : undefined,
            trees: [
              {
                title: `${cfg.name} (top 5 x 8) – ${formatBytes(total)}`,
                root: prune(t.root, 5, 0, 8),
              },
            ],
          },
        };
      }),
  };
}
