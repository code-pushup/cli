import { dependenciesAuditMeta } from './integration/dependencies.audit';
import { licenseAuditMeta } from './integration/license.audit';
import { typeAuditInfoMeta } from './integration/type.audit';

export const pluginSlug = 'package-json';
export const audits = [
  dependenciesAuditMeta,
  licenseAuditMeta,
  typeAuditInfoMeta,
];
