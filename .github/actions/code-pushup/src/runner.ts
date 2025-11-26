import * as core from '@actions/core';
import * as github from '@actions/github';
import type { WebhookPayload } from '@actions/github/lib/interfaces';
import type { components } from '@octokit/openapi-types';
import {
  type Comment,
  type GitBranch,
  type Options,
  type ProviderAPIClient,
  type SourceFileIssue,
  runInCI,
} from '@code-pushup/ci';
import {
  CODE_PUSHUP_UNICODE_LOGO,
  logger,
  stringifyError,
} from '@code-pushup/utils';

type GitHubRefs = {
  head: GitBranch;
  base?: GitBranch;
};

type PullRequestPayload = NonNullable<WebhookPayload['pull_request']> &
  components['schemas']['pull-request-minimal'];

const LOG_PREFIX = '[Code PushUp GitHub action]';

const MAX_COMMENT_CHARS = 65_536;

function convertComment(
  comment: Pick<components['schemas']['issue-comment'], 'id' | 'body' | 'url'>,
): Comment {
  const { id, body = '', url } = comment;
  return { id, body, url };
}

function isPullRequest(
  payload: WebhookPayload['pull_request'],
): payload is PullRequestPayload {
  return payload != null;
}

function parseBranchRef({ ref, sha }: GitBranch): GitBranch {
  return {
    ref: ref.split('/').at(-1) ?? ref,
    sha,
  };
}

function parseGitRefs(): GitHubRefs {
  if (isPullRequest(github.context.payload.pull_request)) {
    const { head, base } = github.context.payload.pull_request;
    return { head: parseBranchRef(head), base: parseBranchRef(base) };
  }
  return { head: parseBranchRef(github.context) };
}

function createAnnotationsFromIssues(issues: SourceFileIssue[]): void {
  if (issues.length > 0) {
    core.info(`Creating annotations for ${issues.length} issues:`);
  }
  // eslint-disable-next-line functional/no-loop-statements
  for (const issue of issues) {
    const message = issue.message;
    const properties: core.AnnotationProperties = {
      title: `${CODE_PUSHUP_UNICODE_LOGO} ${issue.plugin.title} | ${issue.audit.title}`,
      file: issue.source.file,
      startLine: issue.source.position?.startLine,
      startColumn: issue.source.position?.startColumn,
      endLine: issue.source.position?.endLine,
      endColumn: issue.source.position?.endColumn,
    };
    switch (issue.severity) {
      case 'error':
        core.error(message, properties);
        break;
      case 'warning':
        core.warning(message, properties);
        break;
      case 'info':
        core.notice(message, properties);
        break;
    }
  }
}

function createGitHubApiClient(): ProviderAPIClient {
  const token = process.env.GH_TOKEN;

  if (!token) {
    throw new Error('No GitHub token found');
  }

  const octokit = github.getOctokit(token);

  return {
    maxCommentChars: MAX_COMMENT_CHARS,

    listComments: async (): Promise<Comment[]> => {
      const comments = await octokit.paginate(
        octokit.rest.issues.listComments,
        {
          ...github.context.repo,
          issue_number: github.context.issue.number,
        },
      );
      return comments.map(convertComment);
    },

    createComment: async (body: string): Promise<Comment> => {
      const { data } = await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: github.context.issue.number,
        body,
      });
      return convertComment(data);
    },

    updateComment: async (id: number, body: string): Promise<Comment> => {
      const { data } = await octokit.rest.issues.updateComment({
        ...github.context.repo,
        comment_id: id,
        body,
      });
      return convertComment(data);
    },
  };
}

async function run(): Promise<void> {
  try {
    if (core.isDebug()) {
      logger.setVerbose(true);
    }

    const options: Options = {
      monorepo: true,
    };

    const gitRefs = parseGitRefs();

    const apiClient = createGitHubApiClient();

    const result = await runInCI(gitRefs, apiClient, options);

    const issues =
      result.mode === 'standalone'
        ? (result.newIssues ?? [])
        : result.projects.flatMap(project => project.newIssues ?? []);

    if (issues.length > 0) {
      core.info(
        `Found ${issues.length} new issues, creating GitHub annotations`,
      );
      createAnnotationsFromIssues(issues);
    }

    core.info(`${LOG_PREFIX} Finished running successfully`);
  } catch (error) {
    const message = stringifyError(error);
    core.error(`${LOG_PREFIX} Failed: ${message}`);
    core.setFailed(message);
  }
}

await run();
