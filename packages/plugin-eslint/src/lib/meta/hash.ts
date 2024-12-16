import { createHash } from 'node:crypto';
import { slugify } from '@code-pushup/utils';
import { type RuleData, resolveRuleOptions } from './parse.js';

export function ruleToSlug(rule: RuleData): string {
  return ruleIdToSlug(rule.id, resolveRuleOptions(rule));
}

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
    .update(JSON.stringify(data) || 'null')
    .digest('hex');
}
