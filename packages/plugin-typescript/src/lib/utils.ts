import type { Audit } from '@code-pushup/models';

export function filterAuditsBySlug(slugs?: string[]) {
  return ({ slug }: Audit) => {
    if (slugs && slugs.length > 0) {
      return slugs.includes(slug);
    }
    return true;
  };
}
