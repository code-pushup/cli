import { z } from 'zod';
import {
  type IssueSeverity,
  issueSeveritySchema,
  pluginScoreTargetsSchema,
} from '@code-pushup/models';
import { defaultAuditLevelMapping } from './constants.js';

export const dependencyGroups = ['prod', 'dev', 'optional'] as const;
const dependencyGroupSchema = z.enum(dependencyGroups);
export type DependencyGroup = (typeof dependencyGroups)[number];

const packageCommandSchema = z.enum(['audit', 'outdated']).meta({
  title: 'PackageCommand',
});
export type PackageCommand = z.infer<typeof packageCommandSchema>;

const packageManagerIdSchema = z
  .enum(['npm', 'yarn-classic', 'yarn-modern', 'pnpm'])
  .meta({ title: 'PackageManagerId' });
export type PackageManagerId = z.infer<typeof packageManagerIdSchema>;

const packageJsonPathSchema = z
  .string()
  .regex(/package\.json$/, 'File path must end with package.json')
  .meta({
    title: 'PackageJsonPath',
    description:
      'File path to package.json, tries to use root package.json at CWD by default',
  })
  .default('package.json');

export type PackageJsonPath = z.infer<typeof packageJsonPathSchema>;

export const packageAuditLevels = [
  'critical',
  'high',
  'moderate',
  'low',
  'info',
] as const;
const packageAuditLevelSchema = z.enum(packageAuditLevels).meta({
  title: 'PackageAuditLevel',
});
export type PackageAuditLevel = z.infer<typeof packageAuditLevelSchema>;

export type AuditSeverity = Record<PackageAuditLevel, IssueSeverity>;

export function fillAuditLevelMapping(
  mapping: Partial<AuditSeverity>,
): AuditSeverity {
  return {
    critical: mapping.critical ?? defaultAuditLevelMapping.critical,
    high: mapping.high ?? defaultAuditLevelMapping.high,
    moderate: mapping.moderate ?? defaultAuditLevelMapping.moderate,
    low: mapping.low ?? defaultAuditLevelMapping.low,
    info: mapping.info ?? defaultAuditLevelMapping.info,
  };
}

export const jsPackagesPluginConfigSchema = z
  .object({
    checks: z
      .array(packageCommandSchema)
      .min(1)
      .default(['audit', 'outdated'])
      .meta({
        description:
          'Package manager commands to be run. Defaults to both audit and outdated.',
      }),
    packageManager: packageManagerIdSchema
      .meta({ description: 'Package manager to be used.' })
      .optional(),
    dependencyGroups: z
      .array(dependencyGroupSchema)
      .min(1)
      .default(['prod', 'dev']),
    auditLevelMapping: z
      .partialRecord(packageAuditLevelSchema, issueSeveritySchema)
      .default(defaultAuditLevelMapping)
      .transform(fillAuditLevelMapping)
      .describe(
        'Mapping of audit levels to issue severity. Custom mapping or overrides may be entered manually, otherwise has a default preset.',
      ),
    packageJsonPath: packageJsonPathSchema,
    scoreTargets: pluginScoreTargetsSchema,
  })
  .meta({ title: 'JSPackagesPluginConfig' });

export type JSPackagesPluginConfig = z.input<
  typeof jsPackagesPluginConfigSchema
>;

export type FinalJSPackagesPluginConfig = Required<
  Omit<z.infer<typeof jsPackagesPluginConfigSchema>, 'scoreTargets'>
>;
