import { PLUGIN_NAME } from './plugin/constants.js';
import { createNodesV2 } from './plugin/index.js';

// default export for nx.json#plugins
const plugin = {
  name: PLUGIN_NAME,
  createNodesV2,
};

export default plugin;

export type { CliCommandExecutorOptions } from './executors/cli/schema.js';
export { generateCodePushupConfig } from './generators/configuration/code-pushup-config.js';
export { configurationGenerator } from './generators/configuration/generator.js';
export type { ConfigurationGeneratorOptions } from './generators/configuration/schema.js';
export { initGenerator, initSchematic } from './generators/init/generator.js';
export { type InitGeneratorSchema } from './generators/init/schema.js';
export * from './internal/versions.js';
export { createNodesV2 } from './plugin/index.js';
