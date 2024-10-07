import type { MonorepoTool, MonorepoToolHandler } from '../tools';
import { npmHandler } from './npm';
import { nxHandler } from './nx';
import { pnpmHandler } from './pnpm';
import { turboHandler } from './turbo';
import { yarnHandler } from './yarn';

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
