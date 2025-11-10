import { logger, stringifyError } from '@code-pushup/utils';

export async function loadPortalClient(): Promise<
  typeof import('@code-pushup/portal-client') | null
> {
  try {
    return await import('@code-pushup/portal-client');
  } catch (error) {
    logger.warn(
      `Failed to import @code-pushup/portal-client - ${stringifyError(error)}`,
    );
    logger.error(
      'Optional peer dependency @code-pushup/portal-client is not available. Make sure it is installed to enable upload functionality.',
    );
    return null;
  }
}
