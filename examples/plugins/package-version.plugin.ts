import {readdir} from 'fs/promises';
import {
  AuditOutput,
  AuditOutputs,
  Issue,
  PluginConfig,
} from '../../dist/packages/models';
import {pluralize, readJsonFile} from '../../dist/packages/utils';
import {CategoryRef} from '../../packages/models/src';

export type PluginOptions = {
  directory: string;
  packages: Record<string, string>;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'package-version';

const packageVersionsAuditSlug = 'package-version-check';
const audits = {
  [packageVersionsAuditSlug]: {
    slug: packageVersionsAuditSlug,
    title: 'Package Version Audit',
    description: 'A audit to check NPM package versions`.',
  },
};

export const recommendedRefs: CategoryRef[] = Object.values(audits).map(
  ({slug}) => ({
    type: 'audit',
    plugin: pluginSlug,
    slug,
    weight: 1,
  }),
);

/**
 * @example
 * // code-pushup.config.ts
 * import {
 *   create as packageVersionPlugin,
 *   recommendedRef as packageVersionRecommendedRefs
 * } from 'package-version.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await packageVersionPlugin({
 *       directory: join(process.cwd(), './')
 *     })
 *   ],
 *   categories: [
 *     {
 *       slug: 'code-quality',
 *       title: 'Code Quality',
 *       refs: [
 *         ...packageVersionPluginRecommendedRefs
 *       ]
 *     }
 *   ]
 * }
 */
export async function create(options: PluginOptions): Promise<PluginConfig> {
  return {
    slug: pluginSlug,
    title: 'Package Version',
    icon: 'javascript',
    description:
      'A audit to check NPM package versions.',
    runner: () => runnerFunction(options),
    audits: Object.values(audits),
  };
}

async function runnerFunction(options: RunnerOptions): Promise<AuditOutputs> {
  let packageVersionsAuditOutput: AuditOutput = {
    slug: packageVersionsAuditSlug,
    score: 0,
    value: 0,
    displayValue: `?????????`,
  };

  const issues = await packageVersionCheck(options);

  // early exit if no issues
  if (!issues.length) {
    return [packageVersionsAuditOutput];
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const score = errorCount > 0 ? (errorCount / issues.length - 1) * -1 : 0;

  packageVersionsAuditOutput = {
    ...packageVersionsAuditOutput,
    score,
    value: errorCount,
    displayValue: `${errorCount} ${
      errorCount === 1 ? 'file' : pluralize('file')
    }`,
  };

  if (issues.length) {
    packageVersionsAuditOutput = {
      ...packageVersionsAuditOutput,
      details: {
        issues,
      },
    };
  }

  return [packageVersionsAuditOutput];
}

async function packageVersionCheck(options: PluginOptions): Promise<Issue[]> {
  const {directory, packages} = options;

  let issues: Issue[] = [];
  const files = await readdir(directory);

  const pkgs = files.filter(f => f === 'package.json');

  const pkg = await readJsonFile<{dependencies: Record<string, string>}>(pkgs[0]);

  Object.entries(packages)
    .forEach(([name, version]) => {
       const pkgGiven = Object.keys(pkg.dependencies).find((n) => n === name);

      if (!pkgGiven) {
        issues.push(packageNotGiven(name));
      } else {
        const targetVersion = packages[name];
        const givenVersion = pkg.dependencies[name];

        const pkgVersionGiven = targetVersion === givenVersion;
        if (!pkgVersionGiven) {
          issues.push(packageWrongVersion(name, targetVersion, givenVersion));
        }
      }
    });

  return issues;
}

function packageNotGiven(
  packageName: string,
): Issue {
  return {
    message: `Package ${packageName} is not installed.`,
    severity: 'error',
    source: {
      file: packageName,
    }
  };
}


function packageWrongVersion(
  packageName: string,
  targetVersion: string,
  givenVersion: string
): Issue {
  return {
    message: `Package ${packageName} has wrong version. Wanted ${targetVersion} but got ${givenVersion}`,
    severity: 'error',
    source: {
      file: packageName,
    }
  };
}
