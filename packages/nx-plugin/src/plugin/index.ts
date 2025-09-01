import type { NxPlugin } from '@nx/devkit';
import { createNodesV2 } from './plugin.js';

export { createNodes, createNodesV2 } from './plugin.js';
export type { CreateNodesOptions } from './types.js';

const plugin = {
  createNodesV2,
  name: 'code-pushup-nx-plugin',
} satisfies NxPlugin;

export default plugin;
