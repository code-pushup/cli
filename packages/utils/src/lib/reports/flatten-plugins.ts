import { Report } from '@code-pushup/models';

// generic type params infers ScoredGroup if ScoredReport provided
export function listGroupsFromAllPlugins<T extends Report>(
  report: T,
): {
  plugin: T['plugins'][0];
  group: NonNullable<T['plugins'][0]['groups']>[0];
}[] {
  return report.plugins.flatMap(
    plugin => plugin.groups?.map(group => ({ plugin, group })) ?? [],
  );
}

export function listAuditsFromAllPlugins<T extends Report>(
  report: T,
): {
  plugin: T['plugins'][0];
  audit: T['plugins'][0]['audits'][0];
}[] {
  return report.plugins.flatMap(plugin =>
    plugin.audits.map(audit => ({ plugin, audit })),
  );
}
