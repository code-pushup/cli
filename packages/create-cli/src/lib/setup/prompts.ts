import { checkbox, input, select } from '@inquirer/prompts';
import { asyncSequential } from '@code-pushup/utils';
import type {
  CliArgs,
  PluginPromptDescriptor,
  PluginSetupBinding,
} from './types.js';

/**
 * Resolves which plugins to include in the generated config.
 *
 * Resolution order (first match wins):
 * 1. `--plugins`: user-provided slugs
 * 2. `--yes`: recommended plugins
 * 3. Interactive: checkbox prompt with recommended plugins pre-checked
 */
export async function promptPluginSelection(
  bindings: PluginSetupBinding[],
  targetDir: string,
  { plugins, yes }: CliArgs,
): Promise<PluginSetupBinding[]> {
  if (bindings.length === 0) {
    return [];
  }
  if (plugins != null && plugins.length > 0) {
    return bindings.filter(b => plugins.includes(b.slug));
  }
  const recommended = await detectRecommended(bindings, targetDir);
  if (yes) {
    return bindings.filter(({ slug }) => recommended.has(slug));
  }
  const selected = await checkbox({
    message: 'Plugins to include:',
    required: true,
    choices: bindings.map(({ title, slug }) => ({
      name: title,
      value: slug,
      checked: recommended.has(slug),
    })),
  });
  const selectedSet = new Set(selected);
  return bindings.filter(({ slug }) => selectedSet.has(slug));
}

/**
 * Calls each binding's `isRecommended` callback (if provided)
 * and collects the slugs of bindings that returned `true`.
 */
async function detectRecommended(
  bindings: PluginSetupBinding[],
  targetDir: string,
): Promise<Set<string>> {
  const recommended = new Set<string>();
  await Promise.all(
    bindings.map(async ({ slug, isRecommended }) => {
      if (isRecommended && (await isRecommended(targetDir))) {
        recommended.add(slug);
      }
    }),
  );
  return recommended;
}

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
