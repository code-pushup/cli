import { ui } from '@code-pushup/utils';

export async function loadPortalClient(): Promise<
  typeof import('@code-pushup/portal-client') | null
> {
  try {
    return await import('@code-pushup/portal-client');
  } catch {
    ui().logger.error(
      'Optional peer dependency @code-pushup/portal-client is not available. Make sure it is installed to enable upload functionality.',
    );
    return null;
  }
}
