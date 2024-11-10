import type { PluginConfig } from '@code-pushup/models';

export const dummyPluginSlug = 'dummy-plugin';

const dummyAuditSlug = 'dummy-audit';
export const dummyAudit = {
  slug: dummyAuditSlug,
  title: 'Dummy Audit',
  description: 'A dummy audit to test the cli.',
};
export function create(): PluginConfig {
  return {
    slug: dummyPluginSlug,
    title: 'Dummy Plugin',
    icon: 'folder-javascript',
    description: 'A dummy plugin to test the cli.',
    runner: () => [
      {
        ...dummyAudit,
        slug: dummyAuditSlug,
        score: 1,
        value: 0,
      },
    ],
    audits: [dummyAudit],
  };
}

export default create;
