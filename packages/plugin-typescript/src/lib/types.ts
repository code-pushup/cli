import type { CamelCaseToKebabCase } from '@code-pushup/utils';
import type { CompilerOptionName } from './runner/types.js';

export type AuditSlug = CamelCaseToKebabCase<CompilerOptionName>;
