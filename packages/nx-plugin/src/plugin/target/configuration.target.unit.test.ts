import { expect } from 'vitest';
import { createConfigurationTarget } from './configuration-target';

describe('createConfigurationTarget', () => {
  it('should return code-pushup--configuration target for given project', () => {
    expect(createConfigurationTarget('my-project')).toStrictEqual({
      command: 'nx g nx-plugin:configuration --project=my-project',
    });
  });

  it('should return code-pushup--configuration target without project name', () => {
    expect(createConfigurationTarget()).toStrictEqual({
      command: `nx g nx-plugin:configuration`,
    });
  });
});
