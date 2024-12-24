import { AUDITS } from './generated/audits.js';

export type AuditSlug = (typeof AUDITS)[number]['slug'];
