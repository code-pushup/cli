import { createNodes } from './plugin';

// default export for nx.json#plugins
export default createNodes;

export * from './internal/versions';
export { type InitGeneratorSchema } from './generators/init/schema';
export { initGenerator, initSchematic } from './generators/init/generator';
export { ConfigurationGeneratorOptions } from './generators/configuration/schema';
export { configurationGenerator } from './generators/configuration/generator';
export { generateCodePushupConfig } from './generators/configuration/code-pushup-config';
export { createNodes } from './plugin';
export { executeProcess, ProcessConfig } from './internal/execute-process';
export { objectToCliArgs } from './executors/internal/cli';
