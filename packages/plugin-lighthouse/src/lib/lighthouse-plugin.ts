import { createRequire } from 'node:module';
import type { PluginConfig, PluginUrls } from '@code-pushup/models';
import { GROUP_CODEPUSHUP } from '@code-pushup/profiler';
import { createPluginSpan } from '@code-pushup/profiler';
import { normalizeUrlInput, profiler } from '@code-pushup/utils';
import {
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_PLUGIN_TITLE,
} from './constants.js';
import { normalizeFlags } from './normalize-flags.js';
import { processAuditsAndGroups } from './processing.js';
import { createRunnerFunction } from './runner/runner.js';
import type { LighthouseOptions } from './types.js';

export function lighthousePlugin(
  urls: PluginUrls,
  flags?: LighthouseOptions,
): PluginConfig {
  return profiler.span(
    `run-${LIGHTHOUSE_PLUGIN_SLUG}-plugin-config`,
    () => {
      const {
        skipAudits,
        onlyAudits,
        onlyCategories,
        scoreTargets,
        ...unparsedFlags
      } = normalizeFlags(flags ?? {});

      const { urls: normalizedUrls, context } = normalizeUrlInput(urls);

      const { audits, groups } = processAuditsAndGroups(normalizedUrls, {
        skipAudits,
        onlyAudits,
        onlyCategories,
      });

      const packageJson = createRequire(import.meta.url)(
        '../../package.json',
      ) as typeof import('../../package.json');

      const result: PluginConfig = {
        slug: LIGHTHOUSE_PLUGIN_SLUG,
        title: LIGHTHOUSE_PLUGIN_TITLE,
        icon: 'lighthouse',
        packageName: packageJson.name,
        version: packageJson.version,
        audits,
        groups,
        runner: createRunnerFunction(normalizedUrls, {
          skipAudits,
          onlyAudits,
          onlyCategories,
          ...unparsedFlags,
        }),
        context,
        ...(scoreTargets && { scoreTargets }),
      };

      return result;
    },
    { detail: profiler.spans.plugins(LIGHTHOUSE_PLUGIN_SLUG)() },
  );
}
