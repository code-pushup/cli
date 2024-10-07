import { DiffNameStatus, simpleGit } from 'simple-git';

export type ChangedFiles = Record<string, ChangedFile>;

type ChangedFile = {
  originalFile?: string;
  lineChanges: LineChange[];
};

type LineChange = {
  prev: { line: number; count: number };
  curr: { line: number; count: number };
};

export async function listChangedFiles(
  refs: {
    base: string;
    head: string;
  },
  git = simpleGit(),
): Promise<ChangedFiles> {
  const statuses: DiffNameStatus[] = [
    DiffNameStatus.ADDED,
    DiffNameStatus.COPIED,
    DiffNameStatus.MODIFIED,
    DiffNameStatus.RENAMED,
  ];
  const { files } = await git.diffSummary([
    refs.base,
    refs.head,
    `--diff-filter=${statuses.join('')}`,
    '--find-renames',
    '--find-copies',
  ]);

  const entries = await Promise.all(
    files
      .filter(({ binary }) => !binary)
      .map(({ file }) => {
        const rename = parseFileRename(file);
        if (rename) {
          return { file: rename.curr, originalFile: rename.prev };
        }
        return { file };
      })
      .map(async ({ file, originalFile }) => {
        const diff = await git.diff([
          '--unified=0',
          refs.base,
          refs.head,
          '--',
          file,
          ...(originalFile ? [originalFile] : []),
        ]);
        const lineChanges = parseDiff(diff);
        return [
          file,
          { ...(originalFile && { originalFile }), lineChanges },
        ] as const;
      }),
  );

  return Object.fromEntries(entries);
}

function parseFileRename(file: string): { prev: string; curr: string } | null {
  const partialRenameMatch = file.match(/^(.*){(.*) => (.*)}(.*)$/);
  if (partialRenameMatch) {
    const [, prefix = '', prev, curr, suffix] = partialRenameMatch;
    return {
      prev: prefix + prev + suffix,
      curr: prefix + curr + suffix,
    };
  }

  const fullRenameMatch = file.match(/^(.*) => (.*)$/);
  if (fullRenameMatch) {
    const [, prev = '', curr = ''] = fullRenameMatch;
    return { prev, curr };
  }

  return null;
}

function parseDiff(diff: string): LineChange[] {
  const changeSummaries = diff.match(/@@ [ \d,+-]+ @@/g);
  if (changeSummaries == null) {
    return [];
  }
  return changeSummaries
    .map(summary => summary.match(/^@@ -(\d+|\d+,\d+) \+(\d+|\d+,\d+) @@$/))
    .filter((matches): matches is RegExpMatchArray => matches != null)
    .map((matches): LineChange => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [prevLine = '', prevAdded = '1'] = matches[1]!.split(',');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [currLine = '', currAdded = '1'] = matches[2]!.split(',');
      return {
        prev: {
          line: Number.parseInt(prevLine, 10),
          count: Number.parseInt(prevAdded, 10),
        },
        curr: {
          line: Number.parseInt(currLine, 10),
          count: Number.parseInt(currAdded, 10),
        },
      };
    });
}

export function isFileChanged(
  changedFiles: ChangedFiles,
  file: string,
): boolean {
  return file in changedFiles;
}

export function adjustFileName(
  changedFiles: ChangedFiles,
  file: string,
): string {
  return (
    Object.entries(changedFiles).find(
      ([, { originalFile }]) => originalFile === file,
    )?.[0] ?? file
  );
}

export function adjustLine(
  changedFiles: ChangedFiles,
  file: string,
  line: number,
): number {
  const changedFile = changedFiles[adjustFileName(changedFiles, file)];
  if (!changedFile) {
    return line;
  }
  const offset = changedFile.lineChanges
    .filter(({ prev }) => prev.line < line)
    .reduce((acc, { prev, curr }) => acc + (curr.count - prev.count), 0);
  return line + offset;
}
