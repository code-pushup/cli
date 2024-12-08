import type { CategoryRef, Group } from '@code-pushup/models';
import { pluginSlug } from './constants.js';
import { dependenciesAuditMeta } from './integration/dependencies.audit.js';
import { licenseAuditMeta } from './integration/license.audit.js';
import { typeAuditInfoMeta } from './integration/type.audit.js';

const documentationGroupSlug = 'documentation';
export const documentationGroup: Group = {
  slug: documentationGroupSlug,
  title: 'Documentation specific audits',
  description:
    'A set of audits focusing on the documentation specific properties in package json as well as their relations',
  refs: [
    {
      ...licenseAuditMeta,
      weight: 1,
    },
  ],
};
export const documentationGroupRef: CategoryRef = {
  slug: documentationGroupSlug,
  type: 'group',
  plugin: pluginSlug,
  weight: 1,
};

const performanceGroupSlug = 'performance';
export const performanceGroup: Group = {
  slug: performanceGroupSlug,
  title: 'Performance specific audits',
  description: 'A set of audits focusing on compile and runtime performance',
  refs: [
    {
      ...typeAuditInfoMeta,
      weight: 1,
    },
  ],
};
export const performanceGroupRef: CategoryRef = {
  slug: performanceGroupSlug,
  type: 'group',
  plugin: pluginSlug,
  weight: 1,
};

const versionControlGroupSlug = 'version-control';
export const versionControlGroup: Group = {
  slug: versionControlGroupSlug,
  title: 'Version Control',
  description: 'A set of audits related to version control',
  refs: [
    {
      ...dependenciesAuditMeta,
      weight: 1,
    },
  ],
};
export const versionControlGroupRef: CategoryRef = {
  slug: versionControlGroupSlug,
  type: 'group',
  plugin: pluginSlug,
  weight: 1,
};

export const recommendedRefs: CategoryRef[] = [
  versionControlGroupRef,
  documentationGroupRef,
  performanceGroupRef,
];
