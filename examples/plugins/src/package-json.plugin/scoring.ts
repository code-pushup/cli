import { AuditGroup, CategoryRef } from '../../../../packages/models/src';
import { dependenciesAuditMeta } from './integration/dependencies.audit';
import { documentationAuditMeta } from './integration/documentation.audit';
import { licenseAuditMeta } from './integration/license.audit';
import { typeAuditInfoMeta } from './integration/type.audit';
import { pluginSlug } from './package-json.plugin';

const documentationGroupSlug = 'documentation';
export const documentationGroup: AuditGroup = {
  slug: documentationGroupSlug,
  title: 'Documentation specific audits',
  description:
    'A set of audits focusing on the documentation specific properties in package json as well as their relations',
  refs: [
    {
      ...documentationAuditMeta,
      weight: 1,
    },
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
  weight: 0,
};

const performanceGroupSlug = 'performance';
export const performanceGroup: AuditGroup = {
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
export const versionControlGroup: AuditGroup = {
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
