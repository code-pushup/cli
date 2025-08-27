import type { AuditOutput, AuditReport } from '@code-pushup/models';

const AGNOSTIC_PATH_SEP_REGEX = /[/\\]/g;
const OS_AGNOSTIC_PATH_SEP = '/';
const OS_AGNOSTIC_CWD = `<CWD>`;

/**
 * Converts a given file path to an OS-agnostic path by replacing the current working directory with '<CWD>'
 * and normalizing path separators to '/'.
 *
 * @param filePath - The file path to be converted.
 * @param separator - The path separator to use for normalization. Defaults to the OS-specific separator.
 * @returns The OS-agnostic path.
 *
 * @example
 *
 * At CWD on Ubuntu (Linux)
 * Input: /home/projects/my-folder/my-file.ts
 * Output: <CWD>/my-folder/my-file.ts
 *
 * At CWD on Windows
 * Input: D:\projects\my-folder\my-file.ts
 * Output: <CWD>/my-folder/my-file.ts
 *
 * At CWD on macOS
 * Input: /Users/projects/my-folder/my-file.ts
 * Output: <CWD>/my-folder/my-file.ts
 *
 * Out of CWD on all OS
 * Input: /Users/projects/../my-folder/my-file.ts
 * Output: ../my-folder/my-file.ts
 *
 * Absolute paths (all OS)
 * Input: \\my-folder\\my-file.ts
 * Output: /my-folder/my-file.ts
 *
 * Relative paths (all OS)
 * Input: ..\\my-folder\\my-file.ts
 * Output: ../my-folder/my-file.ts
 *
 */

export function osAgnosticPath(filePath: string): string;
export function osAgnosticPath(): undefined;
export function osAgnosticPath(filePath?: string): string | undefined {
  if (filePath == null) {
    return filePath;
  }
  // prepare the path for comparison
  // normalize path separators od cwd: "Users\\repo" => "Users/repo"
  const osAgnosticCwd = process
    .cwd()
    .split(AGNOSTIC_PATH_SEP_REGEX)
    .join(OS_AGNOSTIC_PATH_SEP);
  // normalize path separators  => "..\\folder\\repo.ts" => => "../folder/repo.ts"
  const osAgnosticFilePath = filePath
    .split(AGNOSTIC_PATH_SEP_REGEX)
    .join(OS_AGNOSTIC_PATH_SEP);
  // remove the current working directory for easier comparison
  const osAgnosticPathWithoutCwd = osAgnosticFilePath
    .replace(osAgnosticCwd, '')
    // consider already agnostic paths
    .replace(OS_AGNOSTIC_CWD, '');

  // path is outside cwd (Users/repo/../my-folder/my-file.ts)
  if (
    osAgnosticPathWithoutCwd.startsWith(
      `${OS_AGNOSTIC_PATH_SEP}..${OS_AGNOSTIC_PATH_SEP}`,
    )
  ) {
    return osAgnosticPathWithoutCwd.slice(1); // remove the leading '/'
  }

  // path is at cwd (Users/repo/my-folder/my-file.ts)
  if (
    osAgnosticFilePath.startsWith(osAgnosticCwd) ||
    osAgnosticFilePath.startsWith(OS_AGNOSTIC_CWD)
  ) {
    // Add a substitute for the current working directory
    return `${OS_AGNOSTIC_CWD}${osAgnosticPathWithoutCwd}`;
  }

  // Notice: I kept the following conditions for documentation purposes

  // path is absolute (/my-folder/my-file.ts)
  if (osAgnosticPathWithoutCwd.startsWith(OS_AGNOSTIC_PATH_SEP)) {
    return osAgnosticPathWithoutCwd;
  }

  // path is relative (./my-folder/my-file.ts)
  if (osAgnosticPathWithoutCwd.startsWith(`.${OS_AGNOSTIC_PATH_SEP}`)) {
    return osAgnosticPathWithoutCwd;
  }

  // path is segment (my-folder/my-file.ts or my-folder/sub-folder)
  return osAgnosticPathWithoutCwd;
}

export function osAgnosticAudit<T extends AuditOutput | AuditReport>(
  audit: T,
  transformMessage: (message: string) => string = s => s,
): T {
  const { issues = [] } = audit.details ?? {};
  if (issues.every(({ source }) => source == null)) {
    return audit;
  }
  return {
    ...audit,
    details: {
      issues: issues.map(issue =>
        issue.source == null
          ? issue
          : {
              ...issue,
              source: {
                ...issue.source,
                file: osAgnosticPath(issue.source.file),
              },
              message: transformMessage(issue.message),
            },
      ),
    },
  };
}

export function osAgnosticAuditOutputs<T extends AuditOutput | AuditReport>(
  audits: T[],
  transformAuditIssueMessage?: (message: string) => string,
): T[] {
  return audits.map(audit =>
    osAgnosticAudit(audit, transformAuditIssueMessage),
  );
}
