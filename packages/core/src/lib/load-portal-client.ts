import ansis from 'ansis';
import { logger, stringifyError } from '@code-pushup/utils';

export async function loadPortalClient(): Promise<
  typeof import('@code-pushup/portal-client')
> {
  try {
    return await import('@code-pushup/portal-client');
  } catch (error) {
    logger.error(
      `Failed to import @code-pushup/portal-client - ${stringifyError(error)}`,
    );
    throw new Error(
      `The ${ansis.bold('@code-pushup/portal-client')} peer dependency must be installed to enable uploading to Portal.`,
    );
  }
}
