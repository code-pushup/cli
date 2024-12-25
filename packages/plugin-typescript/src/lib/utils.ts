import type {Audit, Group} from '@code-pushup/models';

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
      return refs.some(({slug}) => slugs.includes(slug));
    }
    return true;
  };
}

export function kebabCaseToCamelCase(string: string) {
  return string.split('-').map((segment, index) => {
    return index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1);
  }).join('');
}

export function formatTitle(description: string = '') {
  return description
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

