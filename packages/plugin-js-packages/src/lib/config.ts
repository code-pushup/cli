import { z } from 'zod';
import { IssueSeverity, issueSeveritySchema } from '@code-pushup/models';

const packageCommandSchema = z.enum(['audit', 'outdated']);
export type PackageCommand = z.infer<typeof packageCommandSchema>;

const packageManagerSchema = z.enum(['npm', 'yarn', 'yarn-berry', 'pnpm']);
export type PackageManager = z.infer<typeof packageManagerSchema>;

const packageAuditLevelSchema = z.enum([
  'info',
  'low',
  'moderate',
  'high',
  'critical',
]);
export type PackageAuditLevel = z.infer<typeof packageAuditLevelSchema>;

const defaultAuditLevelMapping: Record<PackageAuditLevel, IssueSeverity> = {
  critical: 'error',
  high: 'error',
  moderate: 'warning',
  low: 'warning',
  info: 'info',
};

export function fillAuditLevelMapping(
  mapping: Partial<Record<PackageAuditLevel, IssueSeverity>>,
): Record<PackageAuditLevel, IssueSeverity> {
  return {
    critical: mapping.critical ?? defaultAuditLevelMapping.critical,
    high: mapping.high ?? defaultAuditLevelMapping.high,
    moderate: mapping.moderate ?? defaultAuditLevelMapping.moderate,
    low: mapping.low ?? defaultAuditLevelMapping.low,
    info: mapping.info ?? defaultAuditLevelMapping.info,
  };
}

// TODO how?
// export function objectKeys<T extends object>(obj: T): (keyof T)[] {
//   return Object.keys(obj) as (keyof T)[];
// }

// function newFillAuditLevelMapping(
//   mapping: Partial<Record<PackageAuditLevel, IssueSeverity>>,
// ): Record<PackageAuditLevel, IssueSeverity> {
//   return Object.fromEntries(
//     objectKeys(defaultAuditLevelMapping).map<
//       [PackageAuditLevel, IssueSeverity]
//     >(auditLevel => [
//       auditLevel,
//       mapping[auditLevel] ?? defaultAuditLevelMapping[auditLevel],
//     ]),
//   );
// }

export const jsPackagesPluginConfigSchema = z.object({
  features: z
    .array(packageCommandSchema, {
      description:
        'Package manager commands to be run. Defaults to both audit and outdated.',
    })
    .min(1)
    .default(['audit', 'outdated']),
  packageManager: packageManagerSchema
    .describe('Package manager to be used. Defaults to npm')
    .default('npm'),
  auditLevelMapping: z
    .record(packageAuditLevelSchema, issueSeveritySchema, {
      description:
        'Mapping of audit levels to issue severity. Custom mapping or overrides may be entered manually, otherwise has a default preset.',
    })
    .default(defaultAuditLevelMapping)
    .transform(fillAuditLevelMapping),
});

export type JSPackagesPluginConfig = z.input<
  typeof jsPackagesPluginConfigSchema
>;

export type FinalJSPackagesPluginConfig = z.infer<
  typeof jsPackagesPluginConfigSchema
>;
