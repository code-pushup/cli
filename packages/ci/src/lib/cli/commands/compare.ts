import type { CommandContext } from '../context.js';
import { executeCliCommand } from '../exec.js';

export async function runCompare(
  context: CommandContext,
  options: { hasFormats: boolean },
): Promise<void> {
  await executeCliCommand(['compare'], context, options);
}
