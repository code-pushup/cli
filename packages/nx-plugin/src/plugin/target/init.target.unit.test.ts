import { expect } from 'vitest';
import { createInitTarget } from './init-target';

describe('createInitTarget', () => {
  it('should return code-pushup--init target for given project', () => {
    const projectName = 'plugin-my-plugin';
    expect(createInitTarget(projectName)).toStrictEqual({
      command: `nx g nx-plugin:init --project=${projectName}`,
    });
  });

  it('should return code-pushup--init target without project name', () => {
    expect(createInitTarget()).toStrictEqual({
      command: `nx g nx-plugin:init`,
    });
  });
});
