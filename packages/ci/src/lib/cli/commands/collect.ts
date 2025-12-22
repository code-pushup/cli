import type { CommandContext } from '../context.js';
import { executeCliCommand } from '../exec.js';

export async function runCollect(
  context: CommandContext,
  options: { hasFormats: boolean },
): Promise<void> {
  await executeCliCommand([], context, options);
}
