import path from 'node:path';
import { parseJsonConfigFileContent, readConfigFile, sys } from 'typescript';

export function loadTargetConfig(tsConfigPath: string) {
  const resolvedConfigPath = path.resolve(tsConfigPath);
  const { config, error } = readConfigFile(resolvedConfigPath, sys.readFile);

  if (error) {
    throw new Error(
      `Error reading TypeScript config file at ${tsConfigPath}:\n${error.messageText}`,
    );
  }

  const parsedConfig = parseJsonConfigFileContent(
    config,
    sys,
    path.dirname(resolvedConfigPath),
    {},
    resolvedConfigPath,
  );

  if (parsedConfig.fileNames.length === 0) {
    throw new Error(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  }

  return parsedConfig;
}
