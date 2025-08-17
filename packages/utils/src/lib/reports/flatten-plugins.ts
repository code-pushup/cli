import type { Report } from '@code-pushup/models';

// generic type param infers ScoredGroup if ScoredReport provided
export function listGroupsFromAllPlugins<T extends Report>(
  report: T,
): {
  plugin: T['plugins'][number];
  group: NonNullable<T['plugins'][number]['groups']>[number];
}[] {
  return report.plugins.flatMap(
    plugin => plugin.groups?.map(group => ({ plugin, group })) ?? [],
  );
}

export function listAuditsFromAllPlugins<T extends Report>(
  report: T,
): {
  plugin: T['plugins'][number];
  audit: T['plugins'][number]['audits'][number];
}[] {
  return report.plugins.flatMap(plugin =>
    plugin.audits.map(audit => ({ plugin, audit })),
  );
}
