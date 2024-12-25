import type { Audit, Group } from '@code-pushup/models';

export function filterAuditsBySlug(slugs?: string[]) {
  return ({ slug }: Audit) => {
    if (slugs && slugs.length > 0) {
      return slugs.includes(slug);
    }
    return true;
  };
}

export function filterGroupsByAuditSlug(slugs?: string[]) {
  return ({ refs }: Group) => {
    if (slugs && slugs.length > 0) {
      return refs.some(({ slug }) => slugs.includes(slug));
    }
    return true;
  };
}

export function camelCaseToKebabCase(string: string): string {
  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function formatTitle(description: string = '') {
  return description
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}
