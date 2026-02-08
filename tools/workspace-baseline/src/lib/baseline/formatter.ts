import ansis from 'ansis';
import type { Diagnostic } from './baseline.json';
import { formatJsonWithDiffs } from './formatter/json-diff-formatter';
import {
  type StylingTheme,
  createColorHelpers,
  resolveTheme,
} from './formatter/theme';

export type { StylingTheme } from './formatter/theme';
export type FileDiagnostics = {
  file: string; // Actual file path that was matched
  pattern: string; // Baseline pattern that matched
  diagnostics: Diagnostic[];
  renamedFrom?: string; // The original file path that was renamed (if rename occurred)
  baselineValue?: Record<string, unknown>; // The baseline structure to show all fields
};
export type DiagnosticFormatter = {
  format(diagnostics: Diagnostic[], filePath: string): string;
  formatByFiles?(
    fileDiagnostics: FileDiagnostics[],
    projectName: string,
    projectRoot?: string,
  ): string;
  headerMessage?: string;
};
export type FormatterOptions = {
  styling?: StylingTheme;
};

function sortFiles(fileDiagnostics: FileDiagnostics[]): FileDiagnostics[] {
  return [...fileDiagnostics].sort((a, b) => {
    const aFile = a.file.split('/').pop() || '';
    const bFile = b.file.split('/').pop() || '';

    if (aFile === 'tsconfig.json') return -1;
    if (bFile === 'tsconfig.json') return 1;
    if (aFile.startsWith('tsconfig.') && aFile.endsWith('.json')) {
      if (bFile.startsWith('tsconfig.') && bFile.endsWith('.json')) {
        return aFile.localeCompare(bFile);
      }
      return -1;
    }
    if (bFile.startsWith('tsconfig.') && bFile.endsWith('.json')) {
      return 1;
    }
    return aFile.localeCompare(bFile);
  });
}

function formatFileHeader(
  fileInfo: FileDiagnostics,
  projectRoot: string | undefined,
  hasColors: boolean,
): string[] {
  const lines: string[] = [];
  const fileName = projectRoot
    ? `${projectRoot}/${fileInfo.file}`
    : fileInfo.file.split('/').pop() || fileInfo.file;
  const patternName = fileInfo.pattern.split('/').pop() || fileInfo.pattern;
  const renamedFromName = fileInfo.renamedFrom
    ? projectRoot
      ? `${projectRoot}/${fileInfo.renamedFrom}`
      : fileInfo.renamedFrom.split('/').pop() || fileInfo.renamedFrom
    : undefined;

  if (renamedFromName) {
    if (!hasColors) {
      lines.push(`file: ${renamedFromName} → ${fileName}`);
      lines.push(`matched by: ${patternName}`);
    } else {
      const oldColored = ansis.cyan(ansis.bold(renamedFromName));
      const arrow = ansis.gray(' → ');
      const newColored = ansis.cyan(ansis.bold(fileName));
      lines.push(`file: ${oldColored}${arrow}${newColored}`);
      lines.push(`matched by: ${ansis.cyan(ansis.bold(patternName))}`);
    }
  } else {
    if (!hasColors) {
      lines.push(`file: ${fileName}`);
      lines.push(`matched by: ${patternName}`);
    } else {
      lines.push(`file: ${ansis.cyan(ansis.bold(fileName))}`);
      lines.push(`matched by: ${ansis.cyan(ansis.bold(patternName))}`);
    }
  }

  return lines;
}

export const createTsconfigFormatter = (
  options?: FormatterOptions,
): DiagnosticFormatter => {
  const config = resolveTheme(options?.styling);
  const colorHelpers = createColorHelpers(config);

  return {
    headerMessage: 'tsconfig out of sync',
    format(diagnostics: Diagnostic[], filePath: string): string {
      if (diagnostics.length === 0) {
        return '';
      }

      const lines: string[] = [];
      lines.push(`${this.headerMessage}: ${filePath}`);
      lines.push('');

      // Group by project
      const projects = new Map<string, Diagnostic[]>();
      for (const diagnostic of diagnostics) {
        const colonIndex = diagnostic.path.indexOf(':');
        const project =
          colonIndex === -1 ? '' : diagnostic.path.slice(0, colonIndex);
        if (!projects.has(project)) {
          projects.set(project, []);
        }
        projects.get(project)!.push(diagnostic);
      }

      // Process each project separately
      for (const [projectName, projectDiagnostics] of projects) {
        if (projectDiagnostics.length === 0) continue;

        lines.push(projectName);
        lines.push('');

        const jsonLines = formatJsonWithDiffs(projectDiagnostics, colorHelpers);
        lines.push(...jsonLines);
        lines.push('');
      }

      return lines.join('\n');
    },
    formatByFiles(
      fileDiagnostics: FileDiagnostics[],
      projectName: string,
      projectRoot?: string,
    ): string {
      if (fileDiagnostics.length === 0) {
        return '';
      }

      const lines: string[] = [];
      lines.push(`${this.headerMessage || 'tsconfig out of sync'}`);
      lines.push('');
      lines.push(`project: ${projectName}`);
      lines.push('');

      const sortedFiles = sortFiles(fileDiagnostics);

      for (let i = 0; i < sortedFiles.length; i++) {
        const fileInfo = sortedFiles[i];
        if (!fileInfo) continue;

        // Add separator for multiple files (except first)
        if (i > 0 && sortedFiles.length > 1) {
          lines.push('────────────────────────────────');
          lines.push('');
        }

        // File header
        const headerLines = formatFileHeader(
          fileInfo,
          projectRoot,
          colorHelpers.hasColors,
        );
        lines.push(...headerLines);
        lines.push('');

        // Format JSON with diffs
        const jsonLines = formatJsonWithDiffs(
          fileInfo.diagnostics,
          colorHelpers,
          fileInfo.baselineValue,
        );
        lines.push(...jsonLines);
        lines.push('');
      }

      return lines.join('\n');
    },
  };
};
