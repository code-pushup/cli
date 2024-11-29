import { dependenciesAuditMeta } from './integration/dependencies.audit.js';
import { licenseAuditMeta } from './integration/license.audit.js';
import { typeAuditInfoMeta } from './integration/type.audit.js';

export const pluginSlug = 'package-json';
export const audits = [
  dependenciesAuditMeta,
  licenseAuditMeta,
  typeAuditInfoMeta,
];
