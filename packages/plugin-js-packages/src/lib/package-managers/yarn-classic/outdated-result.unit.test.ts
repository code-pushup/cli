import { toJsonLines } from '@code-pushup/utils';
import type {
  OutdatedDependency,
  OutdatedResult,
} from '../../runner/outdated/types.js';
import { REQUIRED_OUTDATED_FIELDS } from './constants.js';
import {
  getOutdatedFieldIndexes,
  validateOutdatedFields,
  yarnClassicToOutdatedResult,
} from './outdated-result.js';
import type { YarnClassicFieldName } from './types.js';

describe('yarnClassicToOutdatedResult', () => {
  const yarnInfo = { type: 'info', data: 'Colours' };

  it('should transform Yarn v1 outdated to unified outdated result', () => {
    const table = {
      type: 'table',
      data: {
        head: [
          'Package',
          'Current',
          'Latest',
          'Package Type',
          'URL',
        ] satisfies YarnClassicFieldName[],
        body: [['nx', '16.8.1', '17.0.0', 'dependencies', 'https://nx.dev/']],
      },
    };

    expect(
      yarnClassicToOutdatedResult(toJsonLines([yarnInfo, table])),
    ).toEqual<OutdatedResult>([
      {
        name: 'nx',
        current: '16.8.1',
        latest: '17.0.0',
        type: 'dependencies',
        url: 'https://nx.dev/',
      },
    ]);
  });

  it('should adapt to custom fields and order', () => {
    const table = {
      type: 'table',
      data: {
        head: [
          'Latest',
          'Package Type',
          'Package',
          'Workspaces', // irrelevant
          'Current',
          'Wanted', // irrelevant
        ],
        body: [
          ['13.6.0', 'devDependencies', 'cypress', 'cli', '11.1.1', '13.0.0'],
        ],
      },
    };

    expect(
      yarnClassicToOutdatedResult(toJsonLines([yarnInfo, table])),
    ).toEqual<OutdatedResult>([
      {
        name: 'cypress',
        current: '11.1.1',
        latest: '13.6.0',
        type: 'devDependencies',
      },
    ]);
  });

  it('should transform no dependencies to empty array', () => {
    const table = { type: 'table', data: { head: [], body: [] } };

    expect(yarnClassicToOutdatedResult(toJsonLines([yarnInfo, table]))).toEqual(
      [],
    );
  });
});

describe('validateOutdatedFields', () => {
  it('should consider all required fields as valid', () => {
    expect(validateOutdatedFields(REQUIRED_OUTDATED_FIELDS)).toBeTrue();
  });

  it('should consider optional fields valid', () => {
    expect(
      validateOutdatedFields([...REQUIRED_OUTDATED_FIELDS, 'URL']),
    ).toBeTrue();
  });

  it('should throw for missing required fields', () => {
    expect(() => validateOutdatedFields(['Package', 'Current'])).toThrow(
      'does not contain all required fields',
    );
  });
});

describe('getOutdatedFieldIndexes', () => {
  it('should return relevant fields with their index', () => {
    expect(
      getOutdatedFieldIndexes([...REQUIRED_OUTDATED_FIELDS, 'URL']),
    ).toStrictEqual<Record<keyof OutdatedDependency, number>>({
      name: 0,
      current: 1,
      latest: 2,
      type: 3,
      url: 4,
    });
  });

  it('should tag missing optional fields as -1', () => {
    expect(
      getOutdatedFieldIndexes(['Package', 'Current', 'Latest', 'Package Type']),
    ).toStrictEqual<Record<keyof OutdatedDependency, number>>({
      name: 0,
      current: 1,
      latest: 2,
      type: 3,
      url: -1,
    });
  });

  it('should skip additional fields', () => {
    expect(
      getOutdatedFieldIndexes([
        'Latest',
        'URL',
        'Package Type',
        'Package',
        'Workspaces', // irrelevant
        'Current',
        'Wanted', // irrelevant
      ]),
    ).toStrictEqual<Record<keyof OutdatedDependency, number>>({
      latest: 0,
      url: 1,
      type: 2,
      name: 3,
      current: 5,
    });
  });
});
