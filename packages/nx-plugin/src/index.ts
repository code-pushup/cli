import { createNodes, createNodesV2 } from './plugin/index.js';

// default export for nx.json#plugins
const plugin = {
  name: '@code-pushup/nx-plugin',
  createNodesV2,
  // Keep for backwards compatibility with Nx < 21
  createNodes,
};

export default plugin;

export type { AutorunCommandExecutorOptions } from './executors/cli/schema.js';
export { objectToCliArgs } from './executors/internal/cli.js';
export { generateCodePushupConfig } from './generators/configuration/code-pushup-config.js';
export { configurationGenerator } from './generators/configuration/generator.js';
export type { ConfigurationGeneratorOptions } from './generators/configuration/schema.js';
export { initGenerator, initSchematic } from './generators/init/generator.js';
export { type InitGeneratorSchema } from './generators/init/schema.js';
export * from './internal/versions.js';
export { createNodes, createNodesV2 } from './plugin/index.js';
