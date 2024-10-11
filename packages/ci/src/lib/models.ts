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
  debug?: boolean;
  detectNewIssues?: boolean;
  logger?: Logger;
};

export type Settings = Required<Options>;

export type GitRefs = {
  head: GitBranch;
  base?: GitBranch;
};

export type ProviderAPIClient = {
  maxCommentChars: number;
  downloadReportArtifact?: () => Promise<string>;
  listComments: () => Promise<Comment[]>;
  updateComment: (id: number, body: string) => Promise<Comment>;
  createComment: (body: string) => Promise<Comment>;
};

export type Comment = {
  id: number;
  body: string;
  url: string;
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

export type RunResult = StandaloneRunResult | MonorepoRunResult;

export type StandaloneRunResult = Omit<ProjectRunResult, 'name'> & {
  mode: 'standalone';
  commentId?: number;
};

export type MonorepoRunResult = {
  mode: 'monorepo';
  projects: ProjectRunResult[];
  commentId?: number;
  diffArtifact?: ArtifactData;
};

export type ProjectRunResult = {
  name: string;
  artifacts: {
    report: ArtifactData;
    diff?: ArtifactData;
  };
  newIssues?: SourceFileIssue[];
};

export type ArtifactData = {
  rootDir: string;
  files: string[];
};
