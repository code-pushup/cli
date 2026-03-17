import path from 'node:path';
import {
  type MonorepoTool,
  asyncSequential,
  formatAsciiTable,
  getGitRoot,
  logger,
  toUnixPath,
} from '@code-pushup/utils';
import { promptCiProvider, resolveCi } from './ci.js';
import {
  computeRelativePresetImport,
  generateConfigSource,
  generatePresetSource,
  generateProjectSource,
} from './codegen.js';
import {
  promptConfigFormat,
  readPackageJson,
  resolveFilename,
} from './config-format.js';
import { resolveGitignore } from './gitignore.js';
import {
  addCodePushUpCommand,
  listProjects,
  promptSetupMode,
} from './monorepo.js';
import { promptPluginOptions, promptPluginSelection } from './prompts.js';
import type {
  CliArgs,
  FileChange,
  PluginCodegenResult,
  PluginSetupBinding,
  ScopedPluginResult,
  WriteContext,
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

  const context = await promptSetupMode(targetDir, cliArgs);
  const selectedBindings = await promptPluginSelection(
    bindings,
    targetDir,
    cliArgs,
  );
  const format = await promptConfigFormat(targetDir, cliArgs);
  const ciProvider = await promptCiProvider(cliArgs);

  const resolved: ScopedPluginResult[] = await asyncSequential(
    selectedBindings,
    async binding => ({
      scope: binding.scope ?? 'project',
      result: await resolveBinding(binding, cliArgs, targetDir),
    }),
  );

  const packageJson = await readPackageJson(targetDir);
  const isEsm = packageJson.type === 'module';
  const configFilename = resolveFilename('code-pushup.config', format, isEsm);

  const tree = createTree(await getGitRoot());
  const writeContext: WriteContext = { tree, format, configFilename, isEsm };

  await (context.mode === 'monorepo' && context.tool != null
    ? writeMonorepoConfigs(writeContext, resolved, targetDir, context.tool)
    : writeStandaloneConfig(
        writeContext,
        resolved.map(r => r.result),
      ));

  await resolveGitignore(tree);
  await resolveCi(tree, ciProvider, context);

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
  targetDir: string,
): Promise<PluginCodegenResult> {
  const descriptors = binding.prompts ? await binding.prompts(targetDir) : [];
  const answers =
    descriptors.length > 0
      ? await promptPluginOptions(descriptors, cliArgs)
      : {};
  return binding.generateConfig(answers);
}

async function writeStandaloneConfig(
  { tree, format, configFilename }: WriteContext,
  results: PluginCodegenResult[],
): Promise<void> {
  await tree.write(configFilename, generateConfigSource(results, format));
}

async function writeMonorepoConfigs(
  { tree, format, configFilename, isEsm }: WriteContext,
  resolved: ScopedPluginResult[],
  targetDir: string,
  tool: MonorepoTool,
): Promise<void> {
  const projectResults = resolved
    .filter(r => r.scope === 'project')
    .map(r => r.result);

  const rootResults = resolved
    .filter(r => r.scope === 'root')
    .map(r => r.result);

  const presetFilename = resolveFilename('code-pushup.preset', format, isEsm);
  await tree.write(
    presetFilename,
    generatePresetSource(projectResults, format),
  );

  if (rootResults.length > 0) {
    await tree.write(configFilename, generateConfigSource(rootResults, format));
  }

  const projects = await listProjects(targetDir, tool);
  await Promise.all(
    projects.map(async project => {
      const importPath = computeRelativePresetImport(
        project.relativeDir,
        presetFilename,
      );
      await tree.write(
        toUnixPath(path.join(project.relativeDir, configFilename)),
        generateProjectSource(project.name, importPath),
      );
      await addCodePushUpCommand(tree, project, tool);
    }),
  );
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
