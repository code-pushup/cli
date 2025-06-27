import { describe, expect } from 'vitest';
import { getAudits } from '../utils.js';
import { createRunnerFunction } from './runner.js';

describe('createRunnerFunction', () => {
  it('should create valid audit outputs when called', async () => {
    await expect(
      createRunnerFunction({
        tsconfig:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.all-audits.json',
        expectedAudits: getAudits(),
      })(() => void 0),
    ).resolves.toMatchSnapshot();
  }, 35_000);
});
