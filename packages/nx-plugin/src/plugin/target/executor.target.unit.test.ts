import { expect } from 'vitest';
import { PACKAGE_NAME } from '../../internal/constants';
import { createConfigurationTarget } from './configuration-target';

describe('createConfigurationTarget', () => {
  it('should return code-pushup--configuration target for given project', () => {
    expect(
      createConfigurationTarget({ projectName: 'my-project' }),
    ).toStrictEqual({
      command: `nx g ${PACKAGE_NAME}:configuration --project=my-project`,
    });
  });

  it('should return code-pushup--configuration target without project name', () => {
    expect(createConfigurationTarget()).toStrictEqual({
      command: `nx g ${PACKAGE_NAME}:configuration`,
    });
  });

  it('should use bin if provides', () => {
    expect(createConfigurationTarget({ bin: 'xyz' })).toStrictEqual({
      command: `nx g xyz:configuration`,
    });
  });
});
