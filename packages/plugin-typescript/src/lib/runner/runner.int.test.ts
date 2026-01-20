import { type AuditOutputs, DEFAULT_PERSIST_CONFIG } from '@code-pushup/models';
import { osAgnosticAuditOutputs } from '@code-pushup/test-fixtures';
import { getAudits } from '../utils.js';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  it('should create valid audit outputs when called', async () => {
    const runnerFunction = createRunnerFunction({
      tsconfig:
        'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.all-audits.json',
      expectedAudits: getAudits(),
    });

    const result = await runnerFunction({ persist: DEFAULT_PERSIST_CONFIG });

    expect(osAgnosticAuditOutputs(result as AuditOutputs)).toMatchSnapshot();
  }, 35_000);
});
