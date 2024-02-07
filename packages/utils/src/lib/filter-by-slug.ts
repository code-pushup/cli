import { Audit, Group } from '@code-pushup/models';
import { toArray } from './transform';

export function filterGroupsByAuditSlug(
  groups: Group[],
  auditSlugs: string | string[],
): Group[] {
  const slugs = toArray(auditSlugs);
  if (slugs.length === 0) {
    return groups;
  }
  return (
    groups
      .map(group => ({
        ...group,
        refs: filterSlug(group.refs, slugs),
      }))
      // filter out groups that have no audits includes from onlyAudits (avoid empty groups)
      .filter(group => group.refs.length)
  );
}

export function filterAuditsBySlug(
  list: Audit[],
  auditSlugs: string[] | string,
): Audit[] {
  const slugs = toArray(auditSlugs);
  if (slugs.length === 0) {
    return list;
  }
  return filterSlug(list, slugs);
}

export function filterSlug<T extends { slug: string }>(
  refs: T[],
  slugs: string | string[],
): T[] {
  return refs.filter(({ slug }) => slugs.includes(slug));
}
