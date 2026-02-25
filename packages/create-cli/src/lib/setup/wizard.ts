import { asyncSequential, formatAsciiTable, logger } from '@code-pushup/utils';
import { generateConfigSource } from './codegen.js';
import {
  promptConfigFormat,
  readPackageJson,
  resolveConfigFilename,
} from './config-format.js';
import { promptPluginOptions } from './prompts.js';
import type {
  CliArgs,
  FileChange,
  PluginCodegenResult,
  PluginSetupBinding,
} from './types.js';
import { createTree } from './virtual-fs.js';

/** Runs the interactive setup wizard that generates a Code PushUp config file. */
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

  const tree = createTree(targetDir);
  await tree.write(filename, generateConfigSource(pluginResults, format));

  const changes = tree.listChanges();

  if (cliArgs['dry-run']) {
    logChanges(changes);
    logger.info('Dry run — no files written.');
  } else {
    await tree.flush();
    logChanges(changes);
    logger.info('Setup complete.');
    logger.newline();
    logNextSteps([
      ['npx code-pushup', 'Collect your first report'],
      ['https://github.com/code-pushup/cli#readme', 'Documentation'],
    ]);
  }
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
