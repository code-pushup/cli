import { vi } from 'vitest';
import { ReportFragment } from '@code-pushup/portal-client';

vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      () => ({ packageName: '@code-pushup/cli' } as ReportFragment),
    ),
  };
});
