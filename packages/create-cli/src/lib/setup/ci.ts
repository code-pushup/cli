import { select } from '@inquirer/prompts';
import { logger } from '@code-pushup/utils';
import type { CiProvider, CliArgs, ConfigContext, Tree } from './types.js';

const GITHUB_WORKFLOW_PATH = '.github/workflows/code-pushup.yml';
const GITLAB_CONFIG_PATH = '.gitlab-ci.yml';
const GITLAB_CONFIG_SEPARATE_PATH = 'code-pushup.gitlab-ci.yml';

export async function promptCiProvider(cliArgs: CliArgs): Promise<CiProvider> {
  if (isCiProvider(cliArgs.ci)) {
    return cliArgs.ci;
  }
  if (cliArgs.yes) {
    return 'skip';
  }
  return select<CiProvider>({
    message: 'CI/CD integration:',
    choices: [
      { name: 'GitHub Actions', value: 'github' },
      { name: 'GitLab CI/CD', value: 'gitlab' },
      { name: 'Skip', value: 'skip' },
    ],
    default: 'skip',
  });
}

export async function resolveCi(
  tree: Tree,
  provider: CiProvider,
  context: ConfigContext,
): Promise<void> {
  switch (provider) {
    case 'github':
      await writeGitHubWorkflow(tree, context);
      break;
    case 'gitlab':
      await writeGitLabConfig(tree);
      break;
    case 'skip':
      break;
  }
}

async function writeGitHubWorkflow(
  tree: Tree,
  context: ConfigContext,
): Promise<void> {
  await tree.write(GITHUB_WORKFLOW_PATH, generateGitHubYaml(context));
}

function generateGitHubYaml({ mode, tool }: ConfigContext): string {
  const lines = [
    'name: Code PushUp',
    '',
    'on:',
    '  push:',
    '    branches: [main]',
    '  pull_request:',
    '    branches: [main]',
    '',
    'permissions:',
    '  contents: read',
    '  actions: read',
    '  pull-requests: write',
    '',
    'jobs:',
    '  code-pushup:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - name: Clone repository',
    '        uses: actions/checkout@v5',
    '      - name: Set up Node.js',
    '        uses: actions/setup-node@v6',
    '      - name: Install dependencies',
    '        run: npm ci',
    '      - name: Code PushUp',
    '        uses: code-pushup/github-action@v0',
    ...(mode === 'monorepo' && tool != null
      ? ['        with:', `          monorepo: ${tool}`]
      : []),
  ];
  return `${lines.join('\n')}\n`;
}

async function writeGitLabConfig(tree: Tree): Promise<void> {
  const filePath = await resolveGitLabFilePath(tree);
  await tree.write(filePath, generateGitLabYaml());

  if (filePath === GITLAB_CONFIG_SEPARATE_PATH) {
    logger.warn(
      [
        `Add the following to your ${GITLAB_CONFIG_PATH}:`,
        '  include:',
        `    - local: ${GITLAB_CONFIG_SEPARATE_PATH}`,
      ].join('\n'),
    );
  }
}

function generateGitLabYaml(): string {
  const lines = [
    'workflow:',
    '  rules:',
    '    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH',
    "    - if: $CI_PIPELINE_SOURCE == 'merge_request_event'",
    '',
    'include:',
    '  - https://gitlab.com/code-pushup/gitlab-pipelines-template/-/raw/latest/code-pushup.yml',
  ];
  return `${lines.join('\n')}\n`;
}

async function resolveGitLabFilePath(tree: Tree): Promise<string> {
  if (await tree.exists(GITLAB_CONFIG_PATH)) {
    return GITLAB_CONFIG_SEPARATE_PATH;
  }
  return GITLAB_CONFIG_PATH;
}

function isCiProvider(value: string | undefined): value is CiProvider {
  return value === 'github' || value === 'gitlab' || value === 'skip';
}
