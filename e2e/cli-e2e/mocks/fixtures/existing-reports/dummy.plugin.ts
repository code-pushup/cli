import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PluginConfig } from '@code-pushup/models';

export const dummyPluginSlug = 'dummy-plugin';

const dummyAuditSlug = 'dummy-audit';
export const dummyAudit = {
  slug: dummyAuditSlug,
  title: 'Dummy Audit',
  description: 'A dummy audit to test the cli.',
};

export const dummyCategory = {
  slug: 'dummy-category',
  title: 'Dummy Category',
  refs: [
    {
      type: 'audit',
      plugin: dummyPluginSlug,
      slug: dummyAuditSlug,
      weight: 1,
    },
  ],
};

export function create(): PluginConfig {
  return {
    slug: dummyPluginSlug,
    title: 'Dummy Plugin',
    icon: 'folder-javascript',
    description: 'A dummy plugin to test the cli.',
    runner: async () => {
      const itemCount = JSON.parse(
        await readFile(join('src', 'items.json'), 'utf-8'),
      ).length;
      return [
        {
          ...dummyAudit,
          slug: dummyAuditSlug,
          score: itemCount < 10 ? itemCount / 10 : 1,
          value: itemCount,
        },
      ];
    },
    audits: [dummyAudit],
  };
}

export default create;
