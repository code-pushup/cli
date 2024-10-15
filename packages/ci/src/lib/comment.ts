import { readFile } from 'node:fs/promises';
import type { Logger, ProviderAPIClient } from './models';

export async function commentOnPR(
  mdPath: string,
  api: ProviderAPIClient,
  logger: Logger,
): Promise<number> {
  const markdown = await readFile(mdPath, 'utf8');
  const identifier = `<!-- generated by @code-pushup/ci -->`;
  const body = truncateBody(
    `${markdown}\n\n${identifier}\n`,
    api.maxCommentChars,
    logger,
  );

  const comments = await api.listComments();
  logger.debug(`Fetched ${comments.length} comments for pull request`);

  const prevComment = comments.find(comment =>
    comment.body.includes(identifier),
  );
  logger.debug(
    prevComment
      ? `Found previous comment ${prevComment.id} from Code PushUp`
      : 'Previous Code PushUp comment not found',
  );

  if (prevComment) {
    const updatedComment = await api.updateComment(prevComment.id, body);
    logger.info(`Updated body of comment ${updatedComment.url}`);
    return updatedComment.id;
  }

  const createdComment = await api.createComment(body);
  logger.info(`Created new comment ${createdComment.url}`);
  return createdComment.id;
}

function truncateBody(body: string, max: number, logger: Logger): string {
  const truncateWarning = '...*[Comment body truncated]*';
  if (body.length > max) {
    logger.warn(`Comment body is too long. Truncating to ${max} characters.`);
    return body.slice(0, max - truncateWarning.length) + truncateWarning;
  }
  return body;
}