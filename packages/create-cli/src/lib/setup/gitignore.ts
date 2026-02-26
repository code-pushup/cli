import type { Tree } from './types.js';

const GITIGNORE_FILENAME = '.gitignore';
const REPORTS_DIR = '.code-pushup';
const REPORTS_DIR_ENTRIES = new Set([REPORTS_DIR, `**/${REPORTS_DIR}`]);
const REPORTS_SECTION = `# Code PushUp reports\n${REPORTS_DIR}\n`;

export async function resolveGitignore(tree: Tree): Promise<void> {
  const content = await tree.read(GITIGNORE_FILENAME);
  const updated = resolveGitignoreContent(content);

  if (updated != null) {
    await tree.write(GITIGNORE_FILENAME, updated);
  }
}

function resolveGitignoreContent(content: string | null): string | null {
  if (content == null) {
    return REPORTS_SECTION;
  }
  if (gitignoreContainsEntry(content)) {
    return null;
  }
  const separator = content.endsWith('\n\n')
    ? ''
    : content.endsWith('\n')
      ? '\n'
      : '\n\n';

  return `${content}${separator}${REPORTS_SECTION}`;
}

function gitignoreContainsEntry(content: string): boolean {
  return content.split('\n').some(raw => {
    const line = raw.trim();
    return (
      line !== '' && !line.startsWith('#') && REPORTS_DIR_ENTRIES.has(line)
    );
  });
}
