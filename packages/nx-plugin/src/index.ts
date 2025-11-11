import { plugin } from './plugin/index.js';

export { createNodes, createNodesV2 } from './plugin/index.js';
export type { AutorunCommandExecutorOptions } from './executors/cli/schema.js';
export { generateCodePushupConfig } from './generators/configuration/code-pushup-config.js';
export { configurationGenerator } from './generators/configuration/generator.js';
export type { ConfigurationGeneratorOptions } from './generators/configuration/schema.js';
export { initGenerator, initSchematic } from './generators/init/generator.js';
export { type InitGeneratorSchema } from './generators/init/schema.js';
export * from './internal/versions.js';

export default plugin;
