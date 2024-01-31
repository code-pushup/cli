import { describe, expect, it } from 'vitest';
import { LIGHTHOUSE_URL } from '../mock/constants';
import { create } from './lighthouse.plugin';
import {
  AuditsNotImplementedError,
  WithSlug,
  filterBySlug,
  filterRefsBySlug,
  getLighthouseCliArguments,
} from './utils';

describe('filterBySlug', () => {
  const list: WithSlug[] = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
  const a = list[0] as WithSlug;
  it.each<[string, WithSlug[], string[], WithSlug[]]>([
    ['no-filter', list, [], list],
    ['a-filter', list, ['a'], [a]],
  ])(
    'should filter by slugs for case "%s"',
    (_, testList, slugs, expectedOutput) => {
      expect(filterBySlug(testList, slugs)).toEqual(expectedOutput);
    },
  );
  it.each<[string, WithSlug[], string[], string[]]>([
    ['wrong-filter-1', list, ['d'], ['d']],
    ['wrong-filter-2', list, ['d', 'a'], ['d']],
  ])(
    'should throw for wrong filter case "%s"',
    (_, testList, slugs, wrongSlugs) => {
      expect(() => filterBySlug(testList, slugs)).toThrow(
        new AuditsNotImplementedError(testList, wrongSlugs),
      );
    },
  );
});

describe('filterRefsBySlug', () => {
  const group: { refs: WithSlug[] } = {
    refs: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }],
  };
  const refA = group.refs[0] as WithSlug;
  it.each<[string, { refs: WithSlug[] }, string[], { refs: WithSlug[] }]>([
    ['no-filter', group, [], group],
    [
      'a-filter',
      group,
      ['a'],
      {
        ...group,
        refs: [refA],
      },
    ],
  ])(
    'should filter by slugs for case "%s"',
    (_, testGroup, slugs, expectedOutput) => {
      expect(filterRefsBySlug(testGroup, slugs)).toEqual(expectedOutput);
    },
  );

  it.each<[string, { refs: WithSlug[] }, string[], string[]]>([
    ['wrong-filter-1', group, ['d'], ['d']],
    ['wrong-filter-2', group, ['a', 'd'], ['d']],
  ])(
    'should throw for wrong filter case "%s"',
    (_, testGroup, slugs, wrongSlugs) => {
      expect(() => filterRefsBySlug(testGroup, slugs)).toThrow(
        new AuditsNotImplementedError(testGroup.refs, wrongSlugs),
      );
    },
  );
});

describe('getLighthouseCliArguments', () => {
  it('should parse valid options', () => {
    expect(() =>
      getLighthouseCliArguments({
        url: 'https://code-pushup-portal.com',
      }),
    ).toEqual(
      expect.arrayContaining(['--url=https://code-pushup-portal.com']),
    );
  });

  it('should parse options for headless to new if true is given', () => {
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
      headless: true,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should parse options for headless to new if false is given', () => {
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
      headless: false,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.not.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should parse options for userDataDir correctly', () => {
    const pluginConfig = create({
      url: LIGHTHOUSE_URL,
      userDataDir: 'test',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining([
        '--chrome-flags="--headless=new --user-data-dir=test"',
      ]),
    );
  });
});
