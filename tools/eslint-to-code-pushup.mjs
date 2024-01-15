import {
  createProjectGraphAsync,
  readProjectsConfigurationFromProjectGraph,
} from '@nx/devkit';
import { ESLint } from 'eslint';
import minimatch from 'minimatch';
import fs from 'node:fs/promises';
import path from 'node:path';

// replace these patterns as needed
const TEST_FILE_PATTERNS = [
  '*.spec.ts',
  '*.test.ts',
  '**/test/**/*',
  '**/mock/**/*',
  '**/mocks/**/*',
  '*.cy.ts',
  '*.stories.ts',
];

const graph = await createProjectGraphAsync({ exitOnError: true });
const projects = Object.values(
  readProjectsConfigurationFromProjectGraph(graph).projects,
)
  .filter(project => 'lint' in (project.targets ?? {}))
  .sort((a, b) => a.root.localeCompare(b.root));

for (let i = 0; i < projects.length; i++) {
  const project = projects[i];

  /** @type {import('@nx/eslint/src/executors/lint/schema').Schema} */
  const options = project.targets.lint.options;

  const eslintrc = options.eslintConfig ?? `${project.root}/.eslintrc.json`;
  const patterns = options.lintFilePatterns ?? project.root;

  console.info(
    `Processing Nx ${project.projectType ?? 'project'} "${project.name}" (${
      i + 1
    }/${projects.length}) ...`,
  );

  const eslint = new ESLint({
    overrideConfigFile: eslintrc,
    useEslintrc: false,
    errorOnUnmatchedPattern: false,
    resolvePluginsRelativeTo: options.resolvePluginsRelativeTo ?? undefined,
    ignorePath: options.ignorePath ?? undefined,
    rulePaths: options.rulesdir ?? [],
  });

  const results = await eslint.lintFiles(patterns);

  /** @type {Set<string>} */
  const failingRules = new Set();
  /** @type {Set<string>} */
  const failingRulesTestsOnly = new Set();
  /** @type {Map<string, number>} */
  const errorCounts = new Map();
  /** @type {Map<string, number>} */
  const warningCounts = new Map();

  for (const result of results) {
    const isTestFile = TEST_FILE_PATTERNS.some(pattern =>
      minimatch(result.filePath, pattern),
    );
    for (const { ruleId, severity } of result.messages) {
      if (isTestFile) {
        if (!failingRules.has(ruleId)) {
          failingRulesTestsOnly.add(ruleId);
        }
      } else {
        failingRules.add(ruleId);
        failingRulesTestsOnly.delete(ruleId);
      }
      if (severity === 1) {
        warningCounts.set(ruleId, (warningCounts.get(ruleId) ?? 0) + 1);
      } else {
        errorCounts.set(ruleId, (errorCounts.get(ruleId) ?? 0) + 1);
      }
    }
  }

  /** @param {string} ruleId */
  const formatCounts = ruleId =>
    [
      { kind: 'error', count: errorCounts.get(ruleId) },
      { kind: 'warning', count: warningCounts.get(ruleId) },
    ]
      .filter(({ count }) => count > 0)
      .map(({ kind, count }) =>
        count === 1 ? `1 ${kind}` : `${count} ${kind}s`,
      )
      .join(', ');

  if (failingRules.size > 0) {
    console.info(`• ${failingRules.size} rules need to be disabled`);
    failingRules.forEach(ruleId => {
      console.info(`  - ${ruleId} (${formatCounts(ruleId)})`);
    });
  }
  if (failingRulesTestsOnly.size > 0) {
    console.info(
      `• ${failingRulesTestsOnly.size} rules need to be disabled only for test files`,
    );
    failingRulesTestsOnly.forEach(ruleId => {
      console.info(`  - ${ruleId} (${formatCounts(ruleId)})`);
    });
  }

  if (failingRules.size === 0 && failingRulesTestsOnly.size === 0) {
    console.info('• no rules need to be disabled, nothing to do here\n');
    continue;
  }

  const cpEslintrc =
    'code-pushup.' + path.basename(eslintrc).replace(/^\./, '');

  /** @param {Set<string>} rules */
  const formatRules = (rules, indentLevel = 2) =>
    Array.from(rules.values())
      .sort((a, b) => {
        if (a.includes('/') !== b.includes('/')) {
          return a.includes('/') ? 1 : -1;
        }
        return a.localeCompare(b);
      })
      .map(
        (ruleId, i, arr) =>
          '  '.repeat(indentLevel) +
          `"${ruleId}": "off"${
            i === arr.length - 1 ? '' : ','
          } // ${formatCounts(ruleId)}`,
      )
      .join('\n')
      .replace(/,$/, '');

  /** @type {import('eslint').Linter.Config} */
  const config = `{
  "extends": ["./${cpEslintrc}"],
  // temporarily disable failing rules so \`nx lint\` passes
  // number of errors/warnings per rule recorded at ${new Date().toString()}
  "rules": {
${formatRules(failingRules)}
  }
  ${
    !failingRulesTestsOnly.size
      ? ''
      : `,
  "overrides": [
    {
      "files": ${JSON.stringify(TEST_FILE_PATTERNS)},
      "rules": {
${formatRules(failingRulesTestsOnly, 4)}
      }
    }
  ]`
  }
}`;

  const content = /\.c?[jt]s$/.test(eslintrc)
    ? `module.exports = ${config}`
    : config;

  const cpEslintrcPath = path.join(project.root, cpEslintrc);
  await fs.copyFile(eslintrc, cpEslintrcPath);
  console.info(`• copied ${eslintrc} to ${cpEslintrcPath}`);

  await fs.writeFile(eslintrc, content);
  console.info(
    `• replaced ${eslintrc} to extend ${cpEslintrc} and disable failing rules\n`,
  );
}

process.exit(0);
