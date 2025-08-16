import { expect } from 'vitest';
import { PACKAGE_NAME } from '../../internal/constants.js';
import { createConfigurationTarget } from './configuration-target.js';

describe('createConfigurationTarget', () => {
  it('should return code-pushup--configuration target for given project', () => {
    expect(
      createConfigurationTarget({ projectName: 'my-project' }),
    ).toStrictEqual({
      command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup" --project="my-project"`,
    });
  });

  it('should return code-pushup--configuration target without project name', () => {
    expect(createConfigurationTarget()).toStrictEqual({
      command: `nx g ${PACKAGE_NAME}:configuration --skipTarget --targetName="code-pushup"`,
    });
  });
});
