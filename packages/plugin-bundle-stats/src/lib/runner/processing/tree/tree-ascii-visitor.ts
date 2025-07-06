/**
 * Generic ASCII Tree Visitor - Tree Types & ASCII Rendering
 */
import { walkGeneric, walkGenericWithTypeDispatch } from './tree.walk';
import type { GenericNode, GenericVisitor, PositionState } from './tree.walk';

export type GenericVisitorConfig<TNode extends GenericNode, R = string> = {
  [K in keyof GenericVisitor<TNode, R>]?: GenericVisitor<TNode, R>[K];
} & {
  // Allow for dynamic method names based on node type
  [key: string]:
    | ((node: TNode, position: PositionState) => R | boolean)
    | undefined;
};

export const createGenericVisitor = <TNode extends GenericNode, R>(
  config: GenericVisitorConfig<TNode, R>,
  defaults?: GenericVisitorConfig<TNode, R>,
): GenericVisitor<TNode, R> & Record<string, any> => ({
  enter: config.enter ?? defaults?.enter,
  exit: config.exit ?? defaults?.exit,
  enterChild: config.enterChild ?? defaults?.enterChild,
  exitChild: config.exitChild ?? defaults?.exitChild,
  ...Object.fromEntries(
    Object.entries(config).filter(
      ([key]) => !['enter', 'exit', 'enterChild', 'exitChild'].includes(key),
    ),
  ),
  ...Object.fromEntries(
    Object.entries(defaults || {}).filter(
      ([key]) =>
        !['enter', 'exit', 'enterChild', 'exitChild'].includes(key) &&
        !(key in config),
    ),
  ),
});

/* ═══════════════════════════════════════════════════════════════════════════
   ASCII VISITOR
   ═══════════════════════════════════════════════════════════════════════════ */

export interface RenderedLine {
  readonly prefix: string;
  readonly content: string;
}

export class ConfigurableAsciiVisitor<TNode extends GenericNode>
  implements GenericVisitor<TNode, void>
{
  readonly lines: RenderedLine[] = [];
  private readonly ancestorStates: boolean[] = [];

  constructor(
    private readonly content: GenericVisitor<TNode, string | boolean> &
      Record<string, any>,
    private readonly connector: GenericVisitor<TNode, string> &
      Record<string, any>,
    private readonly typeMap?: Record<string, string>,
  ) {
    // Dynamically add specific enter/exit methods based on type map
    if (typeMap) {
      Object.entries(typeMap).forEach(([type, suffix]) => {
        const enterMethodName = `enter${suffix}`;
        const exitMethodName = `exit${suffix}`;

        // Add enter method
        (this as any)[enterMethodName] = (
          node: TNode,
          position: PositionState,
        ) => {
          return this.emit(node, position);
        };

        // Add exit method (no-op for now)
        (this as any)[exitMethodName] = () => {};
      });
    }
  }

  seedPrefixFlags(isLast?: boolean): void {
    this.ancestorStates.length = 0;
    // Don't add the root's isLast state since it doesn't affect prefix
  }

  private computePrefix(position: PositionState): string {
    let prefix = '';
    // For each depth level, check if we need a vertical line
    // ancestorStates[i] tells us if the ancestor at depth i+1 is the last child
    for (let i = 0; i < position.depth; i++) {
      if (i < this.ancestorStates.length && !this.ancestorStates[i]) {
        // Ancestor at this level is not last, so show vertical line
        prefix += '│  ';
      } else {
        // Ancestor at this level is last, so just spaces
        prefix += '   ';
      }
    }
    return prefix;
  }

  private getMethodName(node: TNode, prefix: 'enter' | 'exit'): string {
    const { type } = node.values;
    const methodSuffix =
      this.typeMap?.[type] || type.charAt(0).toUpperCase() + type.slice(1);
    return `${prefix}${methodSuffix}`;
  }

  private emit(node: TNode, position: PositionState): boolean {
    const enterMethodName = this.getMethodName(node, 'enter');
    const exitMethodName = this.getMethodName(node, 'exit');

    const contentFn = this.content[enterMethodName] as
      | ((node: TNode, pos: PositionState) => string | boolean)
      | undefined;
    const connectorFn = this.connector[enterMethodName] as
      | ((node: TNode, pos: PositionState) => string)
      | undefined;

    const content = contentFn?.(node, position) ?? node.name;
    const connector =
      connectorFn?.(node, position) ?? (position.isLast ? '└─ ' : '├─ ');

    this.lines.push({
      prefix: this.computePrefix(position) + connector,
      content: typeof content === 'string' ? content : node.name,
    });

    // Call exit method if it exists
    const exitFn = this.content[exitMethodName] as
      | ((node: TNode, pos: PositionState) => void)
      | undefined;
    exitFn?.(node, position);

    return typeof content !== 'boolean' || content;
  }

  enter = (node: TNode, position: PositionState): boolean => {
    return this.emit(node, position);
  };

  exit = (): void => {};

  enterChild = (isLast: boolean): void => {
    // Store the isLast state of the child that's about to be processed
    this.ancestorStates.push(isLast);
  };

  exitChild = (): void => {
    this.ancestorStates.pop();
  };
}

export interface GenericTree<TNode extends GenericNode> {
  readonly title: string;
  readonly type: string;
  readonly root: TNode & { children?: TNode[] };
}

export const renderGenericAsciiTree = <TNode extends GenericNode>(
  tree: GenericTree<TNode>,
  content: GenericVisitor<TNode, string | boolean> & Record<string, any>,
  connector: GenericVisitor<TNode, string> & Record<string, any>,
  typeMap?: Record<string, string>,
): string => {
  const visitor = new ConfigurableAsciiVisitor<TNode>(
    content,
    connector,
    typeMap,
  );
  const children = tree.root.children ?? [];

  children.forEach((node, i) => {
    visitor.seedPrefixFlags(i === children.length - 1);
    if (typeMap) {
      walkGenericWithTypeDispatch(node as TNode, visitor, typeMap);
    } else {
      walkGeneric(node as TNode, visitor);
    }
  });

  return visitor.lines
    .map(({ prefix, content }) => prefix + content)
    .join('\n');
};
