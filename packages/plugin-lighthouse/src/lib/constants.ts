import { type Config, type IcuMessage, defaultConfig } from 'lighthouse';
import { Audit, Group } from '@code-pushup/models';

export const LIGHTHOUSE_PLUGIN_SLUG = 'lighthouse';
export const LIGHTHOUSE_REPORT_NAME = 'lighthouse-report.json';

type Meta = { title: IcuMessage; description: IcuMessage };
const { audits, categories } = defaultConfig;
export const GROUPS: Group[] = Object.entries(
  categories as Record<string, Config.CategoryJson>,
).map(([id, category]) => {
  const meta = category as Meta & {
    auditRefs: Config.AuditRefJson[];
  };
  return {
    slug: id,
    title: meta.title.formattedDefault,
    refs: meta.auditRefs.map(ref => ({ slug: ref.id, weight: ref.weight })),
  };
});

export const AUDITS: Audit[] = await Promise.all(
  (audits as string[]).map(async path => {
    const { default: audit } = (await import(
      `lighthouse/core/audits/${path}.js`
    )) as { default: unknown };
    const { meta } = audit as { meta: Meta & { id: string } };
    return {
      slug: meta.id,
      title: meta.title.formattedDefault || (meta.title as unknown as string),
      description:
        meta.description.formattedDefault ||
        (meta.description as unknown as string),
    };
  }),
);
