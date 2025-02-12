import { createNodes } from './plugin/index.js';

// default export for nx.json#plugins
export default createNodes;

export * from './internal/versions.js';
export { type InitGeneratorSchema } from './generators/init/schema.js';
export { initGenerator, initSchematic } from './generators/init/generator.js';
export type { ConfigurationGeneratorOptions } from './generators/configuration/schema.js';
export { configurationGenerator } from './generators/configuration/generator.js';
export { generateCodePushupConfig } from './generators/configuration/code-pushup-config.js';
export { createNodes } from './plugin/index.js';
export {
  executeProcess,
  type ProcessConfig,
} from './internal/execute-process.js';
export { objectToCliArgs } from './executors/internal/cli.js';
export type { AutorunCommandExecutorOptions } from './executors/cli/schema.js';
