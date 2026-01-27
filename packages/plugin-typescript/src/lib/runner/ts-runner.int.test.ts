import { getTypeScriptDiagnostics } from './ts-runner.js';

describe('getTypeScriptDiagnostics', () => {
  it('should return valid diagnostics', () => {
    expect(
      getTypeScriptDiagnostics({
        tsconfig:
          'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
      }),
    ).toHaveLength(5);
  });
});
