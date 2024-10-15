import type { SourceFileIssue } from './issues';
import type { MonorepoTool } from './monorepo';

/**
 * Customization options for {@link runInCI}
 * @see https://github.com/code-pushup/cli/tree/main/packages/ci#options
 */
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

/**
 * {@link Options} with filled-in defaults.
 */
export type Settings = Required<Options>;

/**
 * Branches/commits for {@link runInCI}
 */
export type GitRefs = {
  head: GitBranch;
  base?: GitBranch;
};

/**
 * API client for {@link runInCI} - adapter for CI provider
 * @see https://github.com/code-pushup/cli/tree/main/packages/ci#provider-api-client
 */
export type ProviderAPIClient = {
  maxCommentChars: number;
  downloadReportArtifact?: () => Promise<string | null>;
  listComments: () => Promise<Comment[]>;
  updateComment: (id: number, body: string) => Promise<Comment>;
  createComment: (body: string) => Promise<Comment>;
};

/**
 * PR comment from {@link ProviderAPIClient}
 */
export type Comment = {
  id: number;
  body: string;
  url: string;
};

/**
 * Git ref (e.g. 'main') and commit sha (e.g. '9d7568265bd5b17d1bb51a6eb6407e0d387058d2')
 */
export type GitBranch = {
  ref: string;
  sha: string;
};

/**
 * Logger instance (e.g. `console`) for reporting progress and problems
 */
export type Logger = {
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
};

/**
 * Resolved return value of {@link runInCI}
 */
export type RunResult = StandaloneRunResult | MonorepoRunResult;

/**
 * Resolved return value of {@link runInCI} in standalone mode
 */
export type StandaloneRunResult = Omit<ProjectRunResult, 'name'> & {
  mode: 'standalone';
  commentId?: number;
};

/**
 * Resolved return value of {@link runInCI} in monorepo mode
 */
export type MonorepoRunResult = {
  mode: 'monorepo';
  projects: ProjectRunResult[];
  commentId?: number;
  diffArtifact?: ArtifactData;
};

/**
 * Result of {@link runInCI} for a single project
 */
export type ProjectRunResult = {
  name: string;
  artifacts: {
    report: ArtifactData;
    diff?: ArtifactData;
  };
  newIssues?: SourceFileIssue[];
};

/**
 * Paths to output files from {@link runInCI}, for uploading as job artifact
 */
export type ArtifactData = {
  rootDir: string;
  files: string[];
};
