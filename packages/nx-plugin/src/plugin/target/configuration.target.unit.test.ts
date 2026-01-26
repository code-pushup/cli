import { PACKAGE_NAME } from '../../internal/constants.js';
import { createConfigurationTarget } from './configuration-target.js';

describe('createConfigurationTarget', () => {
  it('should return code-pushup--configuration target for given project', async () => {
    await expect(
      createConfigurationTarget({ projectName: 'my-project' }),
    ).resolves.toStrictEqual({
      command: `nx g ${PACKAGE_NAME}:configuration --project="my-project"`,
    });
  });

  it('should return code-pushup--configuration target without project name', async () => {
    await expect(createConfigurationTarget()).resolves.toStrictEqual({
      command: `nx g ${PACKAGE_NAME}:configuration`,
    });
  });
});
