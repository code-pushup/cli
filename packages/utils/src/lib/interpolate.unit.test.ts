import { interpolate } from './interpolate.js';

describe('interpolate', () => {
  it('should replace variable in string', () => {
    expect(
      interpolate('.code-pushup/{projectName}', { projectName: 'utils' }),
    ).toBe('.code-pushup/utils');
  });

  it('should replace multiple variables', () => {
    expect(
      interpolate('{workspaceRoot}/coverage/{projectRoot}/lcov.info', {
        workspaceRoot: '/home/matej/Projects/code-pushup-cli',
        projectRoot: 'packages/ci',
      }),
    ).toBe(
      '/home/matej/Projects/code-pushup-cli/coverage/packages/ci/lcov.info',
    );
  });

  it('should replace same variable multiple times', () => {
    expect(
      interpolate('.code-pushup/{projectName}/{projectName}-report.json', {
        projectName: 'utils',
      }),
    ).toBe('.code-pushup/utils/utils-report.json');
  });

  it('should not replace missing variables', () => {
    expect(interpolate('{projectRoot}/.code-pushup', {})).toBe(
      '{projectRoot}/.code-pushup',
    );
  });

  it('should support empty string interpolation', () => {
    expect(interpolate('{prefix}report.json', { prefix: '' })).toBe(
      'report.json',
    );
  });

  it('should support strings with only variable', () => {
    expect(interpolate('{projectName}', { projectName: 'utils' })).toBe(
      'utils',
    );
  });

  it('should leave strings without variables unchanged', () => {
    expect(interpolate('.code-pushup', { projectName: 'utils' })).toBe(
      '.code-pushup',
    );
  });
});
