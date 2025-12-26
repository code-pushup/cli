import { createRequire } from 'node:module';
import {
  type Audit,
  type Group,
  type PluginConfig,
  validate,
} from '@code-pushup/models';
import { GROUP_CODEPUSHUP } from '@code-pushup/profiler';
import { createPluginSpan } from '@code-pushup/profiler';
import { logger, pluralizeToken, profiler } from '@code-pushup/utils';
import {
  type CoveragePluginConfig,
  type CoverageType,
  coveragePluginConfigSchema,
} from './config.js';
import { COVERAGE_PLUGIN_SLUG, COVERAGE_PLUGIN_TITLE } from './constants.js';
import { formatMetaLog, typeToAuditSlug, typeToAuditTitle } from './format.js';
import { createRunnerFunction } from './runner/runner.js';
import { coverageDescription, coverageTypeWeightMapper } from './utils.js';

/**
 * Instantiates Code PushUp code coverage plugin for core config.
 *
 * @example
 * import coveragePlugin from '@code-pushup/coverage-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     await coveragePlugin({
 *       reports: [{ resultsPath: 'coverage/cli/lcov.info', pathToProject: 'packages/cli' }]
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export async function coveragePlugin(
  config: CoveragePluginConfig,
): Promise<PluginConfig> {
  const startPluginConfig = profiler.mark(
    `start-${COVERAGE_PLUGIN_SLUG}-plugin-config`,
    createPluginSpan(COVERAGE_PLUGIN_SLUG)({
      group: GROUP_CODEPUSHUP,
      tooltipText: `Loading ${COVERAGE_PLUGIN_TITLE} plugin configuration`,
    }),
  );
  const coverageConfig = validate(coveragePluginConfigSchema, config);

  const audits = coverageConfig.coverageTypes.map(
    (type): Audit => ({
      slug: typeToAuditSlug(type),
      title: typeToAuditTitle(type),
      description: coverageDescription[type],
    }),
  );

  const group: Group = {
    slug: 'coverage',
    title: 'Code coverage metrics',
    description: 'Group containing all defined coverage types as audits.',
    refs: audits.map(audit => ({
      ...audit,
      weight:
        coverageTypeWeightMapper[
          audit.slug.slice(0, audit.slug.indexOf('-')) as CoverageType
        ],
    })),
  };

  logger.info(
    formatMetaLog(
      `Created ${pluralizeToken('audit', audits.length)} (${coverageConfig.coverageTypes.join('/')} coverage) and 1 group`,
    ),
  );

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  const scoreTargets = coverageConfig.scoreTargets;

  const r = {
    slug: COVERAGE_PLUGIN_SLUG,
    title: COVERAGE_PLUGIN_TITLE,
    icon: 'folder-coverage-open',
    description: 'Official Code PushUp code coverage plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/coverage-plugin/',
    packageName: packageJson.name,
    version: packageJson.version,
    audits,
    groups: [group],
    runner: createRunnerFunction(coverageConfig),
    ...(scoreTargets && { scoreTargets }),
  };
  profiler.measure(
    `run-${COVERAGE_PLUGIN_SLUG}-plugin-config`,
    startPluginConfig as PerformanceMeasure,
  );
  return r as any;
}
