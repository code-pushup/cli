import { slugify } from '@quality-metrics/utils';
import { createHash } from 'crypto';

export function ruleIdToSlug(
  ruleId: string,
  options: unknown[] | undefined,
): string {
  const slug = slugify(ruleId);
  if (!options?.length) {
    return slug;
  }
  return `${slug}-${jsonHash(options)}`;
}

export function jsonHash(data: unknown, bytes = 8): string {
  return createHash('shake256', { outputLength: bytes })
    .update(JSON.stringify(data))
    .digest('hex');
}
