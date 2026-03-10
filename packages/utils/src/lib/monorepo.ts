import path from 'node:path';
import { fileExists } from './file-system.js';
import { hasWorkspacesEnabled } from './workspace-packages.js';

export const MONOREPO_TOOLS = ['nx', 'turbo', 'yarn', 'pnpm', 'npm'] as const;
export type MonorepoTool = (typeof MONOREPO_TOOLS)[number];

export const MONOREPO_TOOL_DETECTORS: Record<
  MonorepoTool,
  (cwd: string) => Promise<boolean>
> = {
  nx: cwd => fileExists(path.join(cwd, 'nx.json')),
  turbo: cwd => fileExists(path.join(cwd, 'turbo.json')),
  yarn: async cwd =>
    (await fileExists(path.join(cwd, 'yarn.lock'))) &&
    (await hasWorkspacesEnabled(cwd)),
  pnpm: cwd => fileExists(path.join(cwd, 'pnpm-workspace.yaml')),
  npm: async cwd =>
    (await fileExists(path.join(cwd, 'package-lock.json'))) &&
    (await hasWorkspacesEnabled(cwd)),
};

export async function detectMonorepoTool(
  cwd: string,
): Promise<MonorepoTool | null> {
  // eslint-disable-next-line functional/no-loop-statements
  for (const tool of MONOREPO_TOOLS) {
    if (await MONOREPO_TOOL_DETECTORS[tool](cwd)) {
      return tool;
    }
  }
  return null;
}

export function isMonorepoTool(value: string): value is MonorepoTool {
  return MONOREPO_TOOLS.includes(value as MonorepoTool);
}
