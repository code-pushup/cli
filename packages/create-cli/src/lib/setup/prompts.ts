import { checkbox, input, select } from '@inquirer/prompts';
import { asyncSequential } from '@code-pushup/utils';
import type { CliArgs, PluginPromptDescriptor } from './types.js';

// TODO: #1244 — add promptPluginSelection (multi-select prompt with pre-selection callbacks)

export async function promptPluginOptions(
  descriptors: PluginPromptDescriptor[],
  cliArgs: CliArgs,
): Promise<Record<string, string | string[]>> {
  const fallback = cliArgs['yes']
    ? (descriptor: PluginPromptDescriptor) => descriptor.default
    : runPrompt;

  const entries = await asyncSequential(descriptors, async descriptor => [
    descriptor.key,
    cliValue(descriptor.key, cliArgs) ?? (await fallback(descriptor)),
  ]);
  return Object.fromEntries(entries);
}

function cliValue(key: string, cliArgs: CliArgs): string | undefined {
  const value = cliArgs[key];
  return typeof value === 'string' ? value : undefined;
}

async function runPrompt(
  descriptor: PluginPromptDescriptor,
): Promise<string | string[]> {
  switch (descriptor.type) {
    case 'input':
      return input({
        message: descriptor.message,
        default: descriptor.default,
      });
    case 'select':
      return select({
        message: descriptor.message,
        choices: [...descriptor.choices],
      });
    case 'checkbox':
      return checkbox({
        message: descriptor.message,
        choices: [...descriptor.choices],
      });
  }
}
