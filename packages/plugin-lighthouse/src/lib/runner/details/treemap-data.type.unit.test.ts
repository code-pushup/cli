import { parseTreemapDataToBasicTrees } from './treemap-data.type.js';

describe('parseTreemapDataToBasicTrees', () => {
  it('should convert root nodes to basic trees', () => {
    expect(
      parseTreemapDataToBasicTrees({
        type: 'treemap-data',
        nodes: [
          {
            name: 'https://github.githubassets.com/assets/environment-7b93e0f0c8ff.js',
            resourceBytes: 1438,
            unusedBytes: 376,
            children: [
              {
                name: 'ui/packages',
                resourceBytes: 881,
                unusedBytes: 376,
                children: [
                  {
                    name: 'failbot/failbot-error.ts',
                    resourceBytes: 237,
                    unusedBytes: 113,
                  },
                  {
                    name: 'remove-child-patch/remove-child-patch.ts',
                    resourceBytes: 268,
                  },
                  {
                    name: 'fetch-overrides/fetch-overrides.ts',
                    resourceBytes: 376,
                    unusedBytes: 263,
                  },
                ],
              },
              {
                name: 'app/assets/modules/environment.ts',
                resourceBytes: 42,
              },
              {
                name: '(unmapped)',
                resourceBytes: 515,
              },
            ],
          },
          {
            name: 'https://github.githubassets.com/assets/app_assets_modules_github_behaviors_commenting_edit_ts-app_assets_modules_github_behaviors_ht-83c235-fb43816ab83c.js',
            resourceBytes: 11_903,
            unusedBytes: 10_362,
            children: [
              {
                name: 'app/assets/modules/github/behaviors',
                resourceBytes: 11_369,
                unusedBytes: 10_297,
                children: [
                  {
                    name: 'commenting/edit.ts',
                    resourceBytes: 9290,
                    unusedBytes: 8218,
                  },
                  {
                    name: 'html-validation.ts',
                    resourceBytes: 2079,
                    unusedBytes: 2079,
                    duplicatedNormalizedModuleName:
                      'app/assets/modules/github/behaviors/html-validation.ts',
                  },
                ],
              },
              {
                name: '(unmapped)',
                resourceBytes: 534,
                unusedBytes: 65,
              },
            ],
          },
        ],
      }),
    ).toMatchSnapshot();
  });
});
