import { asyncSequential, logger } from '@code-pushup/utils';
import { generateConfigSource } from './codegen.js';
import { promptPluginOptions } from './prompts.js';
import type {
  CliArgs,
  FileChange,
  PluginCodegenResult,
  PluginSetupBinding,
} from './types.js';
import { createTree } from './virtual-fs.js';

const COLUMN_GAP = 3;

export async function runSetupWizard(
  bindings: PluginSetupBinding[],
  cliArgs: CliArgs,
): Promise<void> {
  const targetDir = cliArgs['target-dir'] ?? process.cwd();

  // TODO: #1245 — prompt for standalone vs monorepo mode
  // TODO: #1244 — prompt user to select plugins from available bindings

  const pluginResults = await asyncSequential(bindings, binding =>
    resolveBinding(binding, cliArgs),
  );

  const tree = createTree(targetDir);
  // TODO: #1243 — select config file format (TS/JS/MJS) based on user choice or tsconfig detection
  tree.write('code-pushup.config.ts', generateConfigSource(pluginResults));

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
      ['npx code-pushup collect', 'Run your first report'],
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
  return binding.codegenConfig(answers);
}

function logChanges(changes: FileChange[]): void {
  changes.forEach(change => {
    logger.info(`${change.type} ${change.path}`);
  });
}

function logNextSteps(steps: [string, string][]): void {
  const colWidth = Math.max(...steps.map(([label]) => label.length));
  logger.info('Next steps:');
  steps.forEach(([label, description]) => {
    logger.info(`  ${label.padEnd(colWidth + COLUMN_GAP)}${description}`);
  });
}
