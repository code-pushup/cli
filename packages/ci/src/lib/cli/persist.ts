import path from 'node:path';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  type Format,
} from '@code-pushup/models';
import { projectToFilename } from '@code-pushup/utils';

export type PersistedCliFiles<T extends Format = Format> =
  PersistedCliFilesFormats<T> & {
    artifactData: {
      rootDir: string;
      files: string[];
    };
  };

export type PersistedCliFilesFormats<T extends Format = Format> = {
  [F in T as `${F}FilePath`]: string;
};

export function persistCliOptions({
  directory,
  project,
  output,
}: {
  directory: string;
  project?: string;
  output: string;
}): string[] {
  return [
    `--persist.outputDir=${path.join(directory, output)}`,
    `--persist.filename=${createFilename(project)}`,
    ...DEFAULT_PERSIST_FORMAT.map(format => `--persist.format=${format}`),
  ];
}

export function persistedCliFiles<TFormat extends Format = Format>({
  directory,
  isDiff,
  project,
  formats,
  output,
}: {
  directory: string;
  isDiff?: boolean;
  project?: string;
  formats?: TFormat[];
  output: string;
}): PersistedCliFiles<TFormat> {
  const rootDir = path.join(directory, output);
  const filename = isDiff
    ? `${createFilename(project)}-diff`
    : createFilename(project);
  const filePaths = (formats ?? DEFAULT_PERSIST_FORMAT).reduce(
    (acc, format) => ({
      ...acc,
      [`${format}FilePath`]: path.join(rootDir, `${filename}.${format}`),
    }),
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter, @typescript-eslint/consistent-type-assertions
    {} as PersistedCliFilesFormats,
  );
  const files = Object.values(filePaths);

  return {
    ...filePaths,
    artifactData: {
      rootDir,
      files,
    },
  };
}

export function findPersistedFiles({
  rootDir,
  files,
  project,
}: {
  rootDir: string;
  files: string[];
  project?: string;
}): PersistedCliFiles {
  const filename = createFilename(project);
  const filePaths = DEFAULT_PERSIST_FORMAT.reduce((acc, format) => {
    const matchedFile = files.find(file => file === `${filename}.${format}`);
    if (!matchedFile) {
      return acc;
    }
    return { ...acc, [`${format}FilePath`]: path.join(rootDir, matchedFile) };
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter, @typescript-eslint/consistent-type-assertions
  }, {} as PersistedCliFilesFormats);
  return {
    ...filePaths,
    artifactData: {
      rootDir,
      files: Object.values(filePaths),
    },
  };
}

function createFilename(project: string | undefined): string {
  if (!project) {
    return DEFAULT_PERSIST_FILENAME;
  }
  const prefix = projectToFilename(project);
  return `${prefix}-${DEFAULT_PERSIST_FILENAME}`;
}
