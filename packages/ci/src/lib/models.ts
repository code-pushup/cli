import type { SourceFileIssue } from './issues';
import type { MonorepoTool } from './monorepo';

export type Options = {
  monorepo?: boolean | MonorepoTool;
  projects?: string[] | null;
  task?: string;
  bin?: string;
  config?: string | null;
  directory?: string;
  silent?: boolean;
  detectNewIssues?: boolean;
  logger?: Logger;
};

export type Settings = Required<Options>;

export type GitRefs = {
  head: GitBranch;
  base?: GitBranch;
};

export type ProviderAPIClient = {
  downloadReportArtifact: () => Promise<string>;
  fetchComments: () => Promise<{ id: number; body: string }[]>;
  updateComment: (id: number, body: string) => Promise<void>;
  createComment: (body: string) => Promise<void>;
};

export type GitBranch = {
  ref: string;
  sha: string;
};

export type Logger = {
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
};

export type RunResult = {
  artifacts: {
    report: ArtifactData;
    diff: ArtifactData;
  };
  newIssues?: SourceFileIssue[];
};

export type ArtifactData = {
  rootDir: string;
  files: string[];
};
