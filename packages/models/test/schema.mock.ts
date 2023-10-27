import { join } from 'path';
import { Audit, AuditGroup, Issue, PersistConfig } from '../src/';

const __auditSlug__ = 'mock-audit-slug';
const __groupSlug__ = 'mock-group-slug';
const __outputFile__ = 'out-execute-plugin.json';
const randWeight = () => Math.floor(Math.random() * 10);

export function mockAuditConfig(opt?: { auditSlug?: string }): Audit {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;

  return {
    slug: auditSlug,
    title: auditSlug + ' title',
    description: 'audit description',
    docsUrl: 'http://www.my-docs.dev',
  } satisfies Required<Audit>;
}

export function mockPersistConfig(opt?: Partial<PersistConfig>): PersistConfig {
  let { outputDir, format } = opt || {};
  outputDir = outputDir || join('tmp', __outputFile__);
  format = format || [];
  return {
    outputDir,
    format,
  } satisfies Required<PersistConfig>;
}

export function mockGroupConfig(opt?: {
  groupSlug?: string;
  auditSlug?: string | string[];
}): AuditGroup {
  let { groupSlug, auditSlug } = opt || {};
  groupSlug = groupSlug || __groupSlug__;
  auditSlug = auditSlug || __auditSlug__;
  return {
    slug: groupSlug,
    title: 'group title',
    description: 'group description',
    docsUrl: 'https://my-group.docs.dev?' + groupSlug,
    refs: Array.isArray(auditSlug)
      ? auditSlug.map(slug => ({
          slug,
          weight: randWeight(),
        }))
      : [
          {
            slug: auditSlug,
            weight: randWeight(),
          },
        ],
  } satisfies Required<AuditGroup>;
}

export function mockIssueOutput(): Issue {
  return {
    severity: 'error',
    message: '',
    source: {
      file: 'the-file.ts',
      position: {
        startLine: 1,
        startColumn: 2,
        endLine: 3,
        endColumn: 4,
      },
    },
  } satisfies Required<Issue>;
}
