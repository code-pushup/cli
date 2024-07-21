import { expect } from 'vitest';
import { createConfigurationTarget } from './configuration-target';

describe('createConfigurationTarget', () => {
  it('should return code-pushup--configuration target for given project', () => {
    const projectName = 'plugin-my-plugin';
    expect(createConfigurationTarget(projectName)).toStrictEqual({
      command: `nx g nx-plugin:configuration --project=${projectName}`,
    });
  });

  it('should return code-pushup--configuration target without project name', () => {
    expect(createConfigurationTarget()).toStrictEqual({
      command: `nx g nx-plugin:configuration`,
    });
  });
});
