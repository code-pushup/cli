import { select } from '@inquirer/prompts';
import * as YAML from 'yaml';
import { getGitDefaultBranch, logger } from '@code-pushup/utils';
import {
  CI_PROVIDERS,
  type CiProvider,
  type CliArgs,
  type ConfigContext,
  type Tree,
} from './types.js';

const GITHUB_WORKFLOW_PATH = '.github/workflows/code-pushup.yml';
const GITLAB_CONFIG_PATH = '.gitlab-ci.yml';
const GITLAB_CONFIG_SEPARATE_PATH = '.gitlab/ci/code-pushup.gitlab-ci.yml';

export async function promptCiProvider(cliArgs: CliArgs): Promise<CiProvider> {
  if (isCiProvider(cliArgs.ci)) {
    return cliArgs.ci;
  }
  if (cliArgs.yes) {
    return 'none';
  }
  return select<CiProvider>({
    message: 'CI/CD integration:',
    choices: [
      { name: 'GitHub Actions', value: 'github' },
      { name: 'GitLab CI/CD', value: 'gitlab' },
      { name: 'none', value: 'none' },
    ],
    default: 'none',
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
    case 'none':
      break;
  }
}

async function writeGitHubWorkflow(
  tree: Tree,
  context: ConfigContext,
): Promise<void> {
  await tree.write(GITHUB_WORKFLOW_PATH, await generateGitHubYaml(context));
}

async function generateGitHubYaml({
  mode,
  tool,
}: ConfigContext): Promise<string> {
  const branch = await getGitDefaultBranch();
  const lines = [
    'name: Code PushUp',
    '',
    'on:',
    '  push:',
    `    branches: [${branch}]`,
    '  pull_request:',
    `    branches: [${branch}]`,
    '',
    'permissions:',
    '  contents: read',
    '  actions: read',
    '  pull-requests: write',
    '',
    'jobs:',
    '  code-pushup:',
    '    runs-on: ubuntu-latest',
    '    name: Code PushUp',
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
    await patchRootGitLabConfig(tree);
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

async function patchRootGitLabConfig(tree: Tree): Promise<void> {
  const content = await tree.read(GITLAB_CONFIG_PATH);
  if (content == null) {
    return;
  }
  const doc = YAML.parseDocument(content);
  if (!YAML.isMap(doc.contents)) {
    logger.warn(
      `Could not update ${GITLAB_CONFIG_PATH}. Add an include entry for ${GITLAB_CONFIG_SEPARATE_PATH} to your config.`,
    );
    return;
  }
  const entry = { local: GITLAB_CONFIG_SEPARATE_PATH };
  const include = doc.get('include', true);
  if (include == null) {
    doc.set('include', doc.createNode([entry]));
  } else if (YAML.isSeq(include)) {
    include.add(doc.createNode(entry));
  } else {
    const existing = doc.get('include');
    doc.set('include', doc.createNode([existing, entry]));
  }
  await tree.write(GITLAB_CONFIG_PATH, doc.toString());
}

async function resolveGitLabFilePath(tree: Tree): Promise<string> {
  if (await tree.exists(GITLAB_CONFIG_PATH)) {
    return GITLAB_CONFIG_SEPARATE_PATH;
  }
  return GITLAB_CONFIG_PATH;
}

function isCiProvider(value: string | undefined): value is CiProvider {
  const validValues: readonly string[] = CI_PROVIDERS;
  return value != null && validValues.includes(value);
}
