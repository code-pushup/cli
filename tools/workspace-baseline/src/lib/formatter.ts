import ansis, { type AnsiColors } from 'ansis';
import { highlight } from 'cli-highlight';
import type { Diagnostic } from './baseline.tsconfig';

export type StylingTheme =
  | 'default'
  | 'minimal'
  | 'colorful'
  | {
      colors?: {
        addition?: AnsiColors;
        update?: AnsiColors;
        removal?: AnsiColors;
        undefined?: AnsiColors;
      };
    };

export type ResolvedStylingConfig = {
  colors: {
    addition: AnsiColors | undefined;
    update: AnsiColors | undefined;
    removal: AnsiColors | undefined;
    undefined: AnsiColors | undefined;
  };
};

const DEFAULT_COLORS = {
  addition: 'green' as AnsiColors,
  update: 'yellow' as AnsiColors,
  removal: 'red' as AnsiColors,
  undefined: 'gray' as AnsiColors,
};

const DEFAULT_FORMATTING = {
  indentSize: 2,
  arrow: '→',
  maxInlineArrayLength: 4,
  maxTruncateArrayLength: 20,
};

export type FileDiagnostics = {
  file: string; // Actual file path that was matched
  pattern: string; // Baseline pattern that matched
  diagnostics: Diagnostic[];
  renamedFrom?: string; // The original file path that was renamed (if rename occurred)
};

export type DiagnosticFormatter = {
  format(diagnostics: Diagnostic[], filePath: string): string;
  formatByFiles?(
    fileDiagnostics: FileDiagnostics[],
    projectName: string,
  ): string;
  headerMessage?: string;
};

export type FormatterOptions = {
  styling?: StylingTheme;
};

export function resolveTheme(theme?: StylingTheme): ResolvedStylingConfig {
  if (!theme || theme === 'default') {
    return {
      colors: DEFAULT_COLORS,
    };
  }

  if (theme === 'minimal') {
    // Minimal theme: no colors (all undefined)
    return {
      colors: {
        addition: undefined,
        update: undefined,
        removal: undefined,
        undefined: undefined,
      },
    };
  }

  if (theme === 'colorful') {
    return {
      colors: {
        addition: 'green',
        update: 'yellow',
        removal: 'red',
        undefined: 'gray',
      },
    };
  }

  // Custom config
  return {
    colors: {
      addition: theme.colors?.addition ?? DEFAULT_COLORS.addition,
      update: theme.colors?.update ?? DEFAULT_COLORS.update,
      removal: theme.colors?.removal ?? DEFAULT_COLORS.removal,
      undefined: theme.colors?.undefined ?? DEFAULT_COLORS.undefined,
    },
  };
}

const formatJsonLikeWithDiffs = (
  diagnostics: Diagnostic[],
  config: ResolvedStylingConfig,
  green: (v: string) => string,
  red: (v: string) => string,
): string[] => {
  const lines: string[] = [];

  // Build the final structure from diagnostics (using 'after' values)
  const structure: Record<string, unknown> = {};
  const diagnosticsByPath = new Map<string, Diagnostic>();

  for (const diagnostic of diagnostics) {
    const colonIndex = diagnostic.path.indexOf(':');
    const configPath =
      colonIndex === -1
        ? diagnostic.path
        : diagnostic.path.slice(colonIndex + 1);
    diagnosticsByPath.set(configPath, diagnostic);

    // Set the 'after' value in the structure
    if (diagnostic.after !== undefined) {
      setNestedValue(structure, configPath.split('.'), diagnostic.after);
    }
  }

  // Format the JSON structure with diffs
  const formatted = formatJsonObject(
    structure,
    diagnosticsByPath,
    config,
    0,
    green,
    red,
  );
  lines.push(...formatted);

  return lines;
};

const setNestedValue = (
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void => {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    if (
      !(key in current) ||
      typeof current[key] !== 'object' ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  const lastKey = path[path.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }
};

const formatJsonObject = (
  obj: Record<string, unknown>,
  diagnosticsByPath: Map<string, Diagnostic>,
  config: ResolvedStylingConfig,
  indentLevel: number,
  green: (v: string) => string,
  red: (v: string) => string,
): string[] => {
  const indentSize = 2;
  const indent = ' '.repeat(indentLevel * indentSize);
  const innerIndent = ' '.repeat((indentLevel + 1) * indentSize);
  const lines: string[] = [];

  lines.push(`${indent}{`);

  const entries = Object.entries(obj);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const [key, value] = entry;
    const isLast = i === entries.length - 1;
    const comma = isLast ? '' : ',';

    const diagnostic = diagnosticsByPath.get(key);

    if (Array.isArray(value)) {
      // Format array with diffs
      lines.push(`${innerIndent}"${key}": [`);
      const arrayLines = formatJsonArray(
        value,
        diagnostic,
        config,
        indentLevel + 2,
        green,
        red,
      );
      lines.push(...arrayLines);
      lines.push(`${innerIndent}]${comma}`);
    } else if (diagnostic && typeof value !== 'object') {
      // Format scalar with diff
      const scalarLines = formatJsonScalar(
        key,
        value,
        diagnostic,
        config,
        indentLevel + 1,
        green,
        red,
      );
      // No trailing commas on diff blocks
      lines.push(...scalarLines);
      if (!isLast) {
        // Add comma only after the last line of the diff block if not last entry
        lines[lines.length - 1] += ',';
      }
    } else {
      // No changes or object, format normally
      if (typeof value === 'object' && value !== null) {
        const nested = formatJsonObject(
          value as Record<string, unknown>,
          diagnosticsByPath,
          config,
          indentLevel + 1,
          green,
          red,
        );
        lines.push(`${innerIndent}"${key}": ${nested[0]}`);
        lines.push(...nested.slice(1));
        lines[lines.length - 1] += comma;
      } else {
        lines.push(`${innerIndent}"${key}": ${JSON.stringify(value)}${comma}`);
      }
    }
  }

  lines.push(`${indent}}`);
  return lines;
};

const formatJsonArray = (
  arr: unknown[],
  diagnostic: Diagnostic | undefined,
  config: ResolvedStylingConfig,
  indentLevel: number,
  green: (v: string) => string,
  red: (v: string) => string,
): string[] => {
  const indentSize = 2;
  const indent = ' '.repeat(indentLevel * indentSize);
  const lines: string[] = [];

  if (diagnostic) {
    const before = Array.isArray(diagnostic.before) ? diagnostic.before : [];
    const after = Array.isArray(diagnostic.after) ? diagnostic.after : [];
    const beforeSet = new Set(before.map(String));
    const afterSet = new Set(after.map(String));

    // Show removed items
    const removedList = before
      .map(String)
      .filter(itemStr => !afterSet.has(itemStr))
      .sort();
    for (const item of removedList) {
      const displayItem =
        item.startsWith('"') && item.endsWith('"') ? item.slice(1, -1) : item;
      lines.push(`${indent}- ${red(JSON.stringify(displayItem))}`);
    }

    // Show added items
    const addedList = after
      .map(String)
      .filter(itemStr => !beforeSet.has(itemStr))
      .sort();
    for (const item of addedList) {
      const displayItem =
        item.startsWith('"') && item.endsWith('"') ? item.slice(1, -1) : item;
      lines.push(`${indent}+ ${green(JSON.stringify(displayItem))}`);
    }
  } else {
    // No changes, show all items with commas (except last)
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const isLast = i === arr.length - 1;
      lines.push(`${indent}${JSON.stringify(item)}${isLast ? '' : ','}`);
    }
  }

  return lines;
};

const formatJsonScalar = (
  key: string,
  value: unknown,
  diagnostic: Diagnostic,
  config: ResolvedStylingConfig,
  indentLevel: number,
  green: (v: string) => string,
  red: (v: string) => string,
): string[] => {
  const indentSize = 2;
  const indent = ' '.repeat(indentLevel * indentSize);
  const before = diagnostic.before;
  const after = diagnostic.after;

  if (before === after) {
    return [`${indent}"${key}": ${JSON.stringify(value)}`];
  }

  if (before === undefined) {
    const afterStr =
      typeof after === 'string' ? JSON.stringify(after) : String(after);
    return [`${indent}"${key}": ${green(afterStr)}`];
  }

  if (after === undefined) {
    const beforeStr =
      typeof before === 'string' ? JSON.stringify(before) : String(before);
    return [`${indent}"${key}": ${red(beforeStr)}`];
  }

  // Change case: before !== after
  const beforeStr =
    typeof before === 'string' ? JSON.stringify(before) : String(before);
  const afterStr =
    typeof after === 'string' ? JSON.stringify(after) : String(after);
  return [
    `${indent}"${key}":`,
    `${indent}  - ${red(beforeStr)}`,
    `${indent}  + ${green(afterStr)}`,
  ];
};

export const createTsconfigFormatter = (
  options?: FormatterOptions,
): DiagnosticFormatter => {
  const config = resolveTheme(options?.styling);
  const hasColors =
    config.colors.addition ||
    config.colors.update ||
    config.colors.removal ||
    config.colors.undefined;
  const green = (v: string) => (config.colors.addition ? ansis.green(v) : v);
  const red = (v: string) => (config.colors.removal ? ansis.red(v) : v);

  return {
    headerMessage: 'tsconfig out of sync',
    format(diagnostics: Diagnostic[], filePath: string): string {
      if (diagnostics.length === 0) {
        return '';
      }
      const lines: string[] = [];

      // Header
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

        // Use the new JSON pipeline for consistent formatting
        const jsonLines = formatJsonLikeWithDiffs(
          projectDiagnostics,
          config,
          green,
          red,
        );
        lines.push(...jsonLines);
        lines.push('');
      }

      return lines.join('\n');
    },
    formatByFiles(
      fileDiagnostics: FileDiagnostics[],
      projectName: string,
    ): string {
      if (fileDiagnostics.length === 0) {
        return '';
      }

      const lines: string[] = [];

      // Header
      lines.push(`${this.headerMessage || 'tsconfig out of sync'}`);
      lines.push('');
      lines.push(`project: ${projectName}`);
      lines.push('');

      // Sort files: tsconfig.json first, then tsconfig.*.json, then others
      const sortedFiles = [...fileDiagnostics].sort((a, b) => {
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

      for (let i = 0; i < sortedFiles.length; i++) {
        const fileInfo = sortedFiles[i];
        if (!fileInfo) continue;

        // Add separator for multiple files (except first)
        if (i > 0 && sortedFiles.length > 1) {
          lines.push('────────────────────────────────');
          lines.push('');
        }

        // File header
        const fileName = fileInfo!.file.split('/').pop() || fileInfo!.file;
        const patternName =
          fileInfo!.pattern.split('/').pop() || fileInfo!.pattern;
        const renamedFromName = fileInfo!.renamedFrom
          ? fileInfo!.renamedFrom.split('/').pop() || fileInfo!.renamedFrom
          : undefined;

        // Check if colors are enabled

        // Handle rename case
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
          // Regular file (no rename)
          if (!hasColors) {
            lines.push(`file: ${fileName}`);
            lines.push(`matched by: ${patternName}`);
          } else {
            lines.push(`file: ${ansis.cyan(ansis.bold(fileName))}`);
            lines.push(`matched by: ${ansis.cyan(ansis.bold(patternName))}`);
          }
        }
        lines.push('');

        // Format JSON with diffs
        const jsonLines = formatJsonLikeWithDiffs(
          fileInfo!.diagnostics,
          config,
          green,
          red,
        );
        lines.push(...jsonLines);
        lines.push('');
      }

      return lines.join('\n');
    },
  };
};
