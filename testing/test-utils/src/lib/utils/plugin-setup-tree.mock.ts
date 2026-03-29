import type { PluginSetupTree } from '@code-pushup/models';

export function createMockTree(
  files: Record<string, string> = {},
): PluginSetupTree & { written: Map<string, string> } {
  const written = new Map<string, string>();
  return {
    written,
    read: async (filePath: string) => files[filePath] ?? null,
    write: async (filePath: string, content: string) => {
      written.set(filePath, content);
    },
  };
}
