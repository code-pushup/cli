import { MONOREPO_TOOL_HANDLERS } from './handlers/index.js';
import type { MonorepoHandlerOptions, MonorepoTool } from './tools.js';

export async function detectMonorepoTool(
  options: MonorepoHandlerOptions,
): Promise<MonorepoTool | null> {
  // eslint-disable-next-line functional/no-loop-statements
  for (const handler of MONOREPO_TOOL_HANDLERS) {
    if (await handler.isConfigured(options)) {
      return handler.tool;
    }
  }
  return null;
}
