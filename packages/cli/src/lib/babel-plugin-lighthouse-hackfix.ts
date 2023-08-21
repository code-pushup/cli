import type { NodePath, PluginObj } from '@babel/core';
import type { CallExpression } from '@babel/types';

type Babel = typeof import('@babel/core');

// replace `import.meta` in Lighthouse source code (incompatible with Jiti)
// often passed to getModuleDirectory and getModulePath: https://github.com/GoogleChrome/lighthouse/blob/main/esm-utils.js#L20-L32
export function babelPluginLighthouseHackfix({ types: t }: Babel): PluginObj {
  return {
    visitor: {
      CallExpression: (path) => {
        if (
          path.node.callee.type === 'Identifier' &&
          (path.node.callee.name === 'getModuleDirectory' ||
            path.node.callee.name === 'getModulePath') &&
          path.node.arguments.length === 1 &&
          path.node.arguments[0].type === 'MetaProperty' &&
          path.node.arguments[0].meta.name === 'import' &&
          path.node.arguments[0].property.name === 'meta'
        ) {
          const dirname = getDirname(path);
          path.replaceWith(t.stringLiteral(dirname));
        }
      },
    },
  };
}

function getDirname(path: NodePath<CallExpression>) {
  if (
    path.parent.type === 'VariableDeclarator' &&
    path.parent.id.type === 'Identifier'
  ) {
    if (path.parent.id.name === 'LH_ROOT') {
      // https://github.com/GoogleChrome/lighthouse/blob/main/root.js#L11
      return './node_modules/lighthouse';
    }

    const nextSibling =
      path.parentPath.parent.type === 'VariableDeclaration'
        ? path.parentPath.parentPath?.getNextSibling()
        : null;
    const nextIdentifierName =
      (nextSibling?.node.type === 'VariableDeclaration' &&
        nextSibling.node.declarations[0].id.type === 'Identifier' &&
        nextSibling.node.declarations[0].id.name) ||
      null;

    if (
      nextIdentifierName === 'FLOW_REPORT_TEMPLATE' ||
      nextIdentifierName === 'REPORT_TEMPLATE'
    ) {
      // https://github.com/GoogleChrome/lighthouse/blob/main/report/generator/flow-report-assets.js#L12
      // https://github.com/GoogleChrome/lighthouse/blob/main/report/generator/report-assets.js#L13
      return './node_modules/lighthouse/report/generator';
    }

    if (
      nextIdentifierName === 'LOCALE_MESSAGES' ||
      nextIdentifierName === 'files'
    )
      // https://github.com/GoogleChrome/lighthouse/blob/main/shared/localization/format.js#L15
      // https://github.com/GoogleChrome/lighthouse/blob/main/shared/localization/locales.js#L31
      return './node_modules/lighthouse/shared/localization';
  }

  return '';
}
