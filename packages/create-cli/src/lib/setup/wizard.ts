import {
  asyncSequential,
  formatAsciiTable,
  getGitRoot,
  logger,
} from '@code-pushup/utils';
import { generateConfigSource } from './codegen.js';
import {
  promptConfigFormat,
  readPackageJson,
  resolveConfigFilename,
} from './config-format.js';
import { resolveGitignore } from './gitignore.js';
import { promptPluginOptions } from './prompts.js';
import type {
  CliArgs,
  FileChange,
  PluginCodegenResult,
  PluginSetupBinding,
} from './types.js';
import { createTree } from './virtual-fs.js';

/**
 * Runs the interactive setup wizard that generates a Code PushUp config file.
 *
 * All file changes are buffered in a virtual tree rooted at the git root,
 * then flushed to disk in one step (or skipped on `--dry-run`).
 */
export async function runSetupWizard(
  bindings: PluginSetupBinding[],
  cliArgs: CliArgs,
): Promise<void> {
  const targetDir = cliArgs['target-dir'] ?? process.cwd();

  // TODO: #1245 — prompt for standalone vs monorepo mode
  // TODO: #1244 — prompt user to select plugins from available bindings

  const format = await promptConfigFormat(targetDir, cliArgs);
  const packageJson = await readPackageJson(targetDir);
  const filename = resolveConfigFilename(format, packageJson.type === 'module');

  const pluginResults = await asyncSequential(bindings, binding =>
    resolveBinding(binding, cliArgs),
  );

  const gitRoot = await getGitRoot();
  const tree = createTree(gitRoot);
  await tree.write(filename, generateConfigSource(pluginResults, format));
  await resolveGitignore(tree);

  logChanges(tree.listChanges());

  if (cliArgs['dry-run']) {
    logger.info('Dry run — no files written.');
    return;
  }

  await tree.flush();

  logger.info('Setup complete.');
  logger.newline();
  logNextSteps([
    ['npx code-pushup', 'Collect your first report'],
    ['https://github.com/code-pushup/cli#readme', 'Documentation'],
  ]);
}

async function resolveBinding(
  binding: PluginSetupBinding,
  cliArgs: CliArgs,
): Promise<PluginCodegenResult> {
  const answers = binding.prompts
    ? await promptPluginOptions(binding.prompts, cliArgs)
    : {};
  return binding.generateConfig(answers);
}

function logChanges(changes: FileChange[]): void {
  changes.forEach(change => {
    logger.info(`${change.type} ${change.path}`);
  });
}

function logNextSteps(steps: [string, string][]): void {
  logger.info(
    formatAsciiTable(
      {
        title: 'Next steps:',
        rows: steps,
      },
      { borderless: true },
    ),
  );
}
