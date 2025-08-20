import { describe, expect } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';
import { getAudits } from '../utils.js';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  it('should create valid audit outputs when called', async () => {
    const runnerFunction = createRunnerFunction({
      tsconfig:
        'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.all-audits.json',
      expectedAudits: getAudits(),
    });

    const result = await runnerFunction();

    const sanitizedResult = result.map(audit => ({
      ...audit,
      ...(audit.details && {
        details: {
          ...audit.details,
          issues: audit.details.issues?.map(issue => ({
            ...issue,
            ...(issue.source && {
              source: {
                ...issue.source,
                file: osAgnosticPath(issue.source.file),
              },
            }),
          })),
        },
      }),
    }));

    await expect(sanitizedResult).toMatchSnapshot();
  }, 35_000);
});
