import { type Tree, readJson } from '@nx/devkit';
import {
  type BaselineConfig,
  type Diagnostic,
  type RootBuilder,
  type SyncResult,
  createRootBuilder,
} from './baseline.json';
import { findMatchingFile, substitutePathsInArray } from './utils';

/**
 * Substitutions for project-specific values in TS config files
 */
export const projectSubstitutions: Record<string, (path: string) => string> = {
  '{projectName}': (path: string) => {
    // Extract project name from path
    // e.g., 'packages/my-package/vitest.unit.config.ts' -> 'my-package'
    const parts = path.split('/');
    // Get the directory name (second to last part)
    return parts[parts.length - 2] || 'unknown';
  },
};

/**
 * Options for creating a TypeScript baseline
 */
export type TsBaselineOptions<T> = {
  matcher: string | string[];
  fileName: string;
  projects?: string[];
  baseline: (root: RootBuilder<T>) => void;
  preserveImports?: boolean;
};

/**
 * Extracts imports from TypeScript file content
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match import statements
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('import type ') ||
      trimmed.startsWith('import{') ||
      trimmed.startsWith('import {')
    ) {
      imports.push(trimmed);
    }
  }

  return imports;
}

/**
 * Reads a TypeScript config file and converts it to a plain object.
 * Handles simple object literals with `export default { ... } satisfies Type`
 */
function readTsConfig<T>(tree: Tree, path: string): T {
  const content = tree.read(path, 'utf-8');
  if (!content) {
    throw new Error(`Failed to read file: ${path}`);
  }

  try {
    // Try to extract the object literal from export default
    // Match: export default { ... } satisfies ...;
    // or: export default { ... };
    const exportMatch = content.match(
      /export\s+default\s+({[\s\S]*?})\s*(?:satisfies[^;]*)?;/,
    );

    if (!exportMatch || !exportMatch[1]) {
      throw new Error(`Could not find export default in ${path}`);
    }

    const objectLiteral = exportMatch[1];

    // Remove function calls and complex expressions for simplicity
    // This is a simplified parser - we'll just try to evaluate it as JSON-like
    const normalized = normalizeToJson(objectLiteral);

    return JSON.parse(normalized) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse TypeScript config ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Normalizes a TypeScript object literal to JSON format
 * Handles basic cases - unquoted keys, single quotes, trailing commas
 */
function normalizeToJson(objectLiteral: string): string {
  let result = objectLiteral;

  // Remove comments (single-line and multi-line)
  result = result.replace(/\/\/.*$/gm, '');
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove function calls - replace with empty array for now
  // e.g., alias: vitestTsconfigPathAliases.tsconfigPathAliases() -> alias: []
  result = result.replace(
    /:\s*[a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*\([^)]*\)/g,
    ': []',
  );
  result = result.replace(/:\s*[a-zA-Z_$][\w$]*\([^)]*\)/g, ': []');

  // Convert single quotes to double quotes, but be careful with strings
  result = result.replace(/'/g, '"');

  // Add quotes to unquoted keys - but not inside arrays
  result = result.replace(/(\s*)([a-zA-Z_$][\w$]*)(\s*):/g, '$1"$2"$3:');

  // Remove trailing commas before closing braces/brackets
  result = result.replace(/,(\s*[}\]])/g, '$1');

  return result;
}

/**
 * Resolves mutation objects to their actual values recursively
 */
function resolveMutations(value: unknown): unknown {
  // Check if this is a mutation object
  if (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    '__updater' in value
  ) {
    const mutation = value as {
      kind: string;
      __updater: (v: any, path: string) => { value: any };
    };
    // Apply the mutation with an empty initial value
    const result =
      mutation.kind === 'array'
        ? mutation.__updater([], '')
        : mutation.__updater({}, '');
    return resolveMutations(result.value);
  }

  if (Array.isArray(value)) {
    return value.map(v => resolveMutations(v));
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = resolveMutations(v);
    }
    return result;
  }

  return value;
}

/**
 * Substitutes template variables in string values
 */
function substituteVariables(
  value: unknown,
  substitutions: Record<string, (path: string) => string>,
  contextPath: string,
): unknown {
  if (typeof value === 'string') {
    let result = value;
    for (const [key, substituter] of Object.entries(substitutions)) {
      if (result.includes(key)) {
        result = result.replace(key, substituter(contextPath));
      }
    }
    return result;
  }

  if (Array.isArray(value)) {
    return value.map(v => substituteVariables(v, substitutions, contextPath));
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = substituteVariables(v, substitutions, contextPath);
    }
    return result;
  }

  return value;
}

/**
 * Serializes a plain object to TypeScript syntax
 */
function serializeTsConfig(
  config: Record<string, unknown>,
  options: {
    imports?: string[];
    satisfiesType?: string;
  } = {},
): string {
  const lines: string[] = [];

  // Add imports
  if (options.imports && options.imports.length > 0) {
    lines.push(...options.imports);
    lines.push('');
  }

  // Serialize the config object
  lines.push('export default ' + stringifyValue(config, 0));

  // Add satisfies clause
  if (options.satisfiesType) {
    lines[lines.length - 1] += ` satisfies ${options.satisfiesType};`;
  } else {
    lines[lines.length - 1] += ';';
  }

  return lines.join('\n');
}

/**
 * Stringifies a value to TypeScript syntax with proper indentation
 */
function stringifyValue(value: unknown, indent: number): string {
  const spaces = '  '.repeat(indent);
  const nextSpaces = '  '.repeat(indent + 1);

  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === 'string') {
    return `'${value}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const items = value.map(
      v => `${nextSpaces}${stringifyValue(v, indent + 1)}`,
    );
    return `[\n${items.join(',\n')},\n${spaces}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([_, v]) => v !== null && v !== undefined,
    );
    if (entries.length === 0) {
      return '{}';
    }
    const props = entries.map(
      ([k, v]) => `${nextSpaces}${k}: ${stringifyValue(v, indent + 1)}`,
    );
    return `{\n${props.join(',\n')},\n${spaces}}`;
  }

  return String(value);
}

/**
 * Creates a TypeScript baseline configuration
 * Similar to createJsonBaselineTyped but for TS files
 */
export const createTsBaseline = <T extends object>(
  options: TsBaselineOptions<T>,
): BaselineConfig => {
  const matchers = Array.isArray(options.matcher)
    ? options.matcher
    : [options.matcher];

  const rootBuilder = createRootBuilder<T>();
  options.baseline(rootBuilder);
  const updater = rootBuilder.__updater;

  return {
    projects: options.projects,
    filePath: options.fileName,
    matcher: options.matcher,
    sync(tree): SyncResult {
      let diagnostics: Diagnostic[] = [];

      // When matcher contains path separators, extract just the filename for scoped tree matching
      const scopedMatchers = matchers.map(m => {
        if (m.includes('/')) {
          // Extract filename from path pattern (e.g., '**/workspace-baseline/vitest.unit.config.ts' -> 'vitest.unit.config.ts')
          return m.split('/').pop() || m;
        }
        return m;
      });

      const path = findMatchingFile(
        tree as Tree & { children?: (path: string) => string[] },
        scopedMatchers,
      );

      if (!path) {
        return { diagnostics };
      }

      // Read the original file to extract imports
      const originalContentBuffer = tree.read(path);
      const originalContent = originalContentBuffer
        ? typeof originalContentBuffer === 'string'
          ? originalContentBuffer
          : originalContentBuffer.toString('utf-8')
        : '';
      const imports =
        options.preserveImports !== false
          ? extractImports(originalContent)
          : [
              "import type { UserConfig as ViteUserConfig } from 'vitest/config';",
            ];

      // Detect satisfies clause
      const satisfiesMatch = originalContent.match(/satisfies\s+([^;]+)/);
      const satisfiesType = satisfiesMatch?.[1]?.trim() ?? 'ViteUserConfig';

      // Read current config as object
      let current: T;
      try {
        current = readTsConfig<T>(tree, path);
      } catch (error) {
        // If parsing fails, start with empty object
        current = {} as T;
      }

      // Apply baseline mutations
      const result = updater(current, '');
      diagnostics = [...diagnostics, ...result.diagnostics];

      // Resolve any remaining mutation objects to their actual values
      let finalValue = resolveMutations(result.value) as Record<
        string,
        unknown
      >;

      // Apply project substitutions to all string values
      finalValue = substituteVariables(
        finalValue,
        projectSubstitutions,
        path,
      ) as Record<string, unknown>;

      // Serialize back to TypeScript
      const tsContent = serializeTsConfig(finalValue, {
        imports,
        satisfiesType,
      });

      // Note: We don't write to the tree here - that's done by the sync command
      // Check if this is a rename scenario
      const pathFileName = path.split('/').pop() || '';
      const isRename = pathFileName !== options.fileName;

      return {
        diagnostics,
        matchedFile: path,
        baselineValue: finalValue,
        formattedContent: tsContent,
        ...(isRename ? { renamedFrom: path } : {}),
      };
    },
  };
};
