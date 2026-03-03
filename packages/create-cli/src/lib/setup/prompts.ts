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
 * 1. `--plugins` CLI argument: comma-separated slugs, validated against available bindings
 * 2. `--yes` flag: recommended plugins (or all if none recommended)
 * 3. Interactive: checkbox prompt with recommended plugins pre-checked
 */
export async function promptPluginSelection(
  bindings: PluginSetupBinding[],
  targetDir: string,
  cliArgs: CliArgs,
): Promise<PluginSetupBinding[]> {
  if (bindings.length === 0) {
    return [];
  }
  const slugs = parsePluginSlugs(cliArgs.plugins);
  if (slugs != null) {
    return filterBindingsBySlugs(bindings, slugs);
  }
  const recommended = await detectRecommended(bindings, targetDir);
  if (cliArgs.yes) {
    return recommended.size > 0
      ? bindings.filter(({ slug }) => recommended.has(slug))
      : bindings;
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

function parsePluginSlugs(value: string | undefined): string[] | null {
  if (value == null || value.trim() === '') {
    return null;
  }
  return [
    ...new Set(
      value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    ),
  ];
}

function filterBindingsBySlugs(
  bindings: PluginSetupBinding[],
  slugs: string[],
): PluginSetupBinding[] {
  const unknown = slugs.filter(slug => !bindings.some(b => b.slug === slug));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown plugin slugs: ${unknown.join(', ')}. Available: ${bindings.map(b => b.slug).join(', ')}`,
    );
  }
  return bindings.filter(b => slugs.includes(b.slug));
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
