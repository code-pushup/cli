import type { MonorepoTool, MonorepoToolHandler } from '../tools.js';
import { npmHandler } from './npm.js';
import { nxHandler } from './nx.js';
import { pnpmHandler } from './pnpm.js';
import { turboHandler } from './turbo.js';
import { yarnHandler } from './yarn.js';

export const MONOREPO_TOOL_HANDLERS = [
  nxHandler,
  turboHandler,
  yarnHandler,
  pnpmHandler,
  npmHandler,
];

export function getToolHandler(tool: MonorepoTool): MonorepoToolHandler {
  const matchedHandler = MONOREPO_TOOL_HANDLERS.find(
    handler => handler.tool === tool,
  );
  if (!matchedHandler) {
    throw new Error(`No handler available for monorepo tool "${tool}"`);
  }
  return matchedHandler;
}
