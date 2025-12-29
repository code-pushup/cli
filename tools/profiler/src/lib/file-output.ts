/**
 * Generic file output interface for writing data to files.
 * Supports JSONL format where each line is a complete JSON object.
 */
export interface FileOutput<I = unknown> {
  readonly filePath: string;
  write(obj: I): void;
  writeImmediate(obj: I): void;
  flush(): void;
  close(): void;
}

export interface FileOutputOptions {
  filePath: string;
  flushEveryN?: number;
  encode?: (obj: unknown) => string | string[] | undefined;
  parse?: (line: string) => string;
}

/**
 * Get the intermediate file path for a given final file path.
 * Used for output formats where data is written to an intermediate file
 * and then converted to the final format.
 */
export function getIntermediatePath(
  finalPath: string,
  options?: {
    intermediateExtension?: string;
    finalExtension?: string;
  },
): string {
  const intermediateExtension = options?.intermediateExtension || '.jsonl';
  const finalExtension = options?.finalExtension || '.json';
  return finalPath.replace(
    new RegExp(`${finalExtension}$`),
    intermediateExtension,
  );
}

/**
 * @deprecated Use getIntermediatePath instead
 */
export function getJsonlPath(jsonPath: string): string {
  return getIntermediatePath(jsonPath, {
    intermediateExtension: '.jsonl',
    finalExtension: '.json',
  });
}
