import type { Audit, Group } from '@code-pushup/models';
import { camelCaseToKebabCase, kebabCaseToSentence } from '@code-pushup/utils';
import {
  GROUPS_DESCRIPTIONS,
  TS_ERROR_CODES,
} from './runner/ts-error-codes.js';

export const TYPESCRIPT_PLUGIN_SLUG = 'typescript';

export const AUDITS = Object.values(TS_ERROR_CODES)
  .flatMap(i => Object.entries(i))
  .reduce<Audit[]>((audits, [name]) => {
    const slug = camelCaseToKebabCase(name);
    const title = kebabCaseToSentence(name);
    return [
      ...audits,
      {
        slug,
        title,
        docsUrl: `https://www.typescriptlang.org/tsconfig/#${name}`,
      },
    ];
  }, []);

const weights = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  strictChecks: 3,
  typeCheckingBehavior: 2,
  controlFlowOptions: 2,
  interopConstraints: 2,
};
export const GROUPS: Group[] = Object.entries(TS_ERROR_CODES).map(
  ([groupSlug, auditMap]) => ({
    slug: camelCaseToKebabCase(groupSlug),
    title: kebabCaseToSentence(groupSlug),
    description:
      GROUPS_DESCRIPTIONS[groupSlug as keyof typeof GROUPS_DESCRIPTIONS],
    refs: Object.keys(auditMap).map(audit => ({
      slug: camelCaseToKebabCase(audit),
      weight: weights[audit as keyof typeof weights] ?? 1,
    })),
  }),
);
