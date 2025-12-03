import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  PluginArtifactOptions,
  RunnerFunction,
} from '@code-pushup/models';
import { asyncSequential, logger } from '@code-pushup/utils';
import type { ESLintPluginRunnerConfig, ESLintTarget } from '../config.js';
import { lint } from './lint.js';
import { lintResultsToAudits, mergeLinterOutputs } from './transform.js';
import { loadArtifacts } from './utils.js';

export function createRunnerFunction(options: {
  audits: Audit[];
  targets: ESLintTarget[];
  artifacts?: PluginArtifactOptions;
}): RunnerFunction {
  const { audits, targets, artifacts } = options;
  const config: ESLintPluginRunnerConfig = {
    targets,
    slugs: audits.map(audit => audit.slug),
  };

  return async (): Promise<AuditOutputs> => {
    logger.info(`ESLint plugin executing ${targets.length} lint targets`);

    const linterOutputs = artifacts
      ? await loadArtifacts(artifacts)
      : await asyncSequential(targets, lint);
    const lintResults = mergeLinterOutputs(linterOutputs);
    const failedAudits = lintResultsToAudits(lintResults);

    return config.slugs.map(
      (slug): AuditOutput =>
        failedAudits.find(audit => audit.slug === slug) ?? {
          slug,
          score: 1,
          value: 0,
          displayValue: 'passed',
          details: { issues: [] },
        },
    );
  };
}
