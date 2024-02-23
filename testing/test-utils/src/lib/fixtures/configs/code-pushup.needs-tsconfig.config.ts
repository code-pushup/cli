// the point is to test runtime import which relies on alias defined in tsconfig "paths"
// importing schemas from '@code-pushup/models' wouldn't work without --tsconfig
import {
  type Audit,
  type AuditOutputs,
  type CoreConfig,
  auditOutputsSchema,
  auditSchema,
} from '@code-pushup/models';

export default {
  plugins: [
    {
      slug: 'good-feels',
      title: 'Good feels',
      icon: 'javascript',
      audits: [
        auditSchema.parse({
          slug: 'always-perfect',
          title: 'Always perfect',
        } satisfies Audit),
      ],
      runner: () =>
        auditOutputsSchema.parseAsync([
          {
            slug: 'always-perfect',
            score: 1,
            value: 100,
            displayValue: '✅ Perfect! 👌',
          },
        ] satisfies AuditOutputs),
    },
  ],
} satisfies CoreConfig;
