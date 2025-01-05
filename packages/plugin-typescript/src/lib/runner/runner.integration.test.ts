import { describe, expect } from 'vitest';
import { getAudits } from '../utils.js';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  it('should create valid audit outputs when called', async () => {
    await expect(
      createRunnerFunction({
        tsConfigPath:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.all-audits.json',
        expectedAudits: getAudits(),
      })(() => void 0),
    ).resolves.toMatchFileSnapshot(
      '__snapshots__/runner-function-all-audits.json',
    );
  }, 60_000);
});
