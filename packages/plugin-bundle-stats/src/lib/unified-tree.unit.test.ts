import { describe, expect, it } from 'vitest';
import type { BasicTree } from '../../../models/src/lib/tree.js';
import { renderBundleStatsTree } from './unified-tree.js';

describe('renderBundleStatsTree', () => {
  it('should render bundle stats tree as ASCII tree with inline snapshot', () => {
    const mockBundleStatsTree: BasicTree = {
      title: 'Test Bundle',
      type: 'basic',
      root: {
        name: 'bundle',
        values: {},
        children: [
          {
            name: 'inputs',
            values: { files: '4' },
            children: [
              {
                name: 'src/index.js',
                values: {
                  bytes: '1250',
                  imports: '2',
                },
                children: [
                  {
                    name: '→ src/utils.js',
                    values: {},
                  },
                  {
                    name: '→ src/helpers.js',
                    values: {},
                  },
                ],
              },
              {
                name: 'src/utils.js',
                values: {
                  bytes: '800',
                  imports: '0',
                },
              },
              {
                name: 'src/helpers.js',
                values: {
                  bytes: '600',
                  imports: '1',
                },
                children: [
                  {
                    name: '→ src/constants.js',
                    values: {},
                  },
                ],
              },
              {
                name: 'src/constants.js',
                values: {
                  bytes: '200',
                  imports: '0',
                },
              },
            ],
          },
          {
            name: 'outputs',
            values: { files: '2' },
            children: [
              {
                name: 'dist/main.js',
                values: { bytes: '2500' },
                children: [
                  {
                    name: '← src/index.js',
                    values: { bytes: '1250' },
                  },
                  {
                    name: '← src/utils.js',
                    values: { bytes: '800' },
                  },
                  {
                    name: '← src/helpers.js',
                    values: { bytes: '600' },
                  },
                  {
                    name: '← src/constants.js',
                    values: { bytes: '200' },
                  },
                ],
              },
              {
                name: 'dist/vendor.js',
                values: { bytes: '1200' },
                children: [
                  {
                    name: '← src/utils.js',
                    values: { bytes: '800' },
                  },
                  {
                    name: '← src/constants.js',
                    values: { bytes: '200' },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const result = renderBundleStatsTree(mockBundleStatsTree);

    expect(result).toMatchInlineSnapshot(`
      "bundle                                      
      ├── inputs                        4         
      │   ├── src/index.js                 1250  2
      │   │   ├── → src/helpers.js                
      │   │   └── → src/utils.js                  
      │   ├── src/utils.js                  800  0
      │   ├── src/helpers.js                600  1
      │   │   └── → src/constants.js              
      │   └── src/constants.js              200  0
      └── outputs                       2         
          ├── dist/main.js                 2500   
          │   ├── ← src/index.js           1250   
          │   ├── ← src/utils.js            800   
          │   ├── ← src/helpers.js          600   
          │   └── ← src/constants.js        200   
          └── dist/vendor.js               1200   
              ├── ← src/utils.js            800   
              └── ← src/constants.js        200   
      "
    `);
  });
});
