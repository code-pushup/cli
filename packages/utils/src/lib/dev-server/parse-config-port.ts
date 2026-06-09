import { readTextFile } from '../file-system.js';

export function parsePortFromSection(
  content: string,
  section: string,
): number | null {
  const sectionPattern = new RegExp(
    `${section}\\s*:\\s*\\{[\\s\\S]*?\\bport\\s*:\\s*(\\d+)`,
  );
  const match = content.match(sectionPattern);
  return match?.[1] != null ? Number(match[1]) : null;
}

export function parseLoosePort(content: string): number | null {
  const match = content.match(/\bport\s*:\s*(\d+)/);
  return match?.[1] != null ? Number(match[1]) : null;
}

export async function parsePortFromConfigFile(
  filePath: string,
  { sections = ['server', 'devServer'] }: { sections?: string[] } = {},
): Promise<number | null> {
  try {
    const content = await readTextFile(filePath);
    for (const section of sections) {
      const sectionPort = parsePortFromSection(content, section);
      if (sectionPort != null) {
        return sectionPort;
      }
    }
    return parseLoosePort(content);
  } catch {
    return null;
  }
}
