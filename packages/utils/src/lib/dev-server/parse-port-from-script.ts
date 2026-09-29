import { DEV_SERVER_PORTS, type DevServerTool } from './default-ports.js';

const SCRIPT_TOOL_PATTERNS: { tool: DevServerTool; pattern: RegExp }[] = [
  { tool: 'vite', pattern: /\bvite\b(?:\s|$)/ },
  { tool: 'next', pattern: /\bnext\s+(?:dev|start)\b/ },
  { tool: 'nuxt', pattern: /\bnuxt\s+dev\b/ },
  { tool: 'astro', pattern: /\bastro\s+dev\b/ },
  { tool: 'angular', pattern: /\b(?:ng\s+serve|nx\s+serve)\b/ },
  { tool: 'cra', pattern: /\breact-scripts\s+start\b/ },
  { tool: 'vueCli', pattern: /\bvue-cli-service\s+serve\b/ },
  { tool: 'webpack', pattern: /\b(?:webpack\s+serve|webpack-dev-server)\b/ },
  { tool: 'parcel', pattern: /\bparcel\b/ },
];

export function parsePortFromScript(script: string): number | undefined {
  const explicitPort = script.match(/(?:--port(?:=|\s+)|-p\s+)(\d+)/);
  if (explicitPort?.[1] != null) {
    return Number(explicitPort[1]);
  }
  return undefined;
}

export function detectToolFromScript(
  script: string,
): DevServerTool | undefined {
  return SCRIPT_TOOL_PATTERNS.find(({ pattern }) => pattern.test(script))?.tool;
}

export function detectPortFromScript(script: string): number | undefined {
  const explicitPort = parsePortFromScript(script);
  if (explicitPort != null) {
    return explicitPort;
  }
  const tool = detectToolFromScript(script);
  return tool != null ? DEV_SERVER_PORTS[tool] : undefined;
}
