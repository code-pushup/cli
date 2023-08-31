import { cliE2e } from './cli-e2e';

describe('cliE2e', () => {
  it('should work', () => {
    expect(cliE2e()).toEqual('cli-e2e');
  });
});
