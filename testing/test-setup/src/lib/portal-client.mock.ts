import { vi } from 'vitest';
import type {
  PortalUploadArgs,
  ReportFragment,
} from '@code-pushup/portal-client';

vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      async ({ data }: PortalUploadArgs): Promise<ReportFragment> => ({
        url: `https://code-pushup.example.com/portal/${data.organization}/${data.project}/commit/${data.commit}`,
      }),
    ),
  };
});
