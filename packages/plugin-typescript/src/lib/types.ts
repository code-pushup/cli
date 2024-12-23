import { SUPPORTED_TS_ERROR_CODES } from './constants.js';
import type { SupportedCompilerErrorCode } from './runner/models.js';

export type AuditSlug =
  (typeof SUPPORTED_TS_ERROR_CODES)[SupportedCompilerErrorCode];
