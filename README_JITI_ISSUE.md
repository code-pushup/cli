# JITI ISSUES

## axe-core

- _Problem:_ Access of `window.document` through 'axe-core' import
  _Reproduction:_ `node --input-type=module -e "import('jiti').then(j=>j.default()( 'axe-core'))"`
  _Error:_

  ```bash
  /node_modules/axe-core/axe.js:14
    var document = window.document;
                          ^
  TypeError: Cannot read properties of undefined (reading 'document')
      at axeFunction (/cli/node_modules/axe-core/axe.js:14:25)
      at /cli/node_modules/axe-core/axe.js:32979:3
      at eval_evalModule (/cli/node_modules/jiti/dist/jiti.cjs:1:196325)
      at jitiRequire (/cli/node_modules/jiti/dist/jiti.cjs:1:190233)
      at /cli/node_modules/jiti/dist/jiti.cjs:1:199352
      at file:///cli/[eval1]:1:35

  Node.js v24.1.0
  ```

  _Issues:_ https://github.com/dequelabs/axe-core/issues/3962
  _Preliminalr fix:_ https://github.com/code-pushup/cli/pull/1228/commits/b7109fb6c78803adae7f11605446ef2b6de950ff

## eslint-vitest

- _Problem:_ eslint helper `eslint-formatter-multi` cant be exetuted with tsx and jiti internally
