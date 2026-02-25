import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileExists, getGitRoot, readTextFile } from '@code-pushup/utils';
import type { FileChange } from './types.js';

const GITIGNORE_FILENAME = '.gitignore';
const REPORTS_DIR = '.code-pushup';

export async function resolveGitignore(): Promise<FileChange | null> {
  const gitRoot = await getGitRoot();
  const gitignorePath = path.join(gitRoot, GITIGNORE_FILENAME);

  const section = `# Code PushUp reports\n${REPORTS_DIR}\n`;

  const hasGitignore = await fileExists(gitignorePath);
  if (!hasGitignore) {
    return { type: 'CREATE', path: GITIGNORE_FILENAME, content: section };
  }

  const currentContent = await readTextFile(gitignorePath);
  if (currentContent.includes(REPORTS_DIR)) {
    return null;
  }

  const separator = currentContent.endsWith('\n\n')
    ? ''
    : currentContent.endsWith('\n')
      ? '\n'
      : '\n\n';

  return {
    type: 'UPDATE',
    path: GITIGNORE_FILENAME,
    content: `${currentContent}${separator}${section}`,
  };
}

export async function updateGitignore(
  change: FileChange | null,
): Promise<void> {
  if (change == null) {
    return;
  }
  const gitRoot = await getGitRoot();
  await writeFile(path.join(gitRoot, change.path), change.content);
}
