/**
 * Bundle Stats Tree Walking - Generic tree traversal
 */
import type {
  AssetNode,
  BundleStatsNode,
  ChunkNode,
  GroupNode,
  ImportNode,
  InputNode,
} from '../bundle-stats.types';

export interface PositionState {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  depth: number;
  siblingCount: number;
}

export interface GenericNodeValues {
  type: string;
  [key: string]: any;
}

export interface GenericNode<T extends GenericNodeValues = GenericNodeValues> {
  name: string;
  values: T;
  children?: GenericNode<any>[];
}

export interface GenericVisitor<
  TNode extends GenericNode = GenericNode,
  R = void,
> {
  enter?(node: TNode, position: PositionState): boolean | R;
  exit?(node: TNode, position: PositionState): R;
  enterChild?(isLast: boolean): void;
  exitChild?(): void;
}

export interface FullVisitor<R = void>
  extends GenericVisitor<BundleStatsNode, R> {
  enterChunk?(node: ChunkNode, position: PositionState): boolean | R;
  exitChunk?(node: ChunkNode, position: PositionState): R;
  enterImport?(node: ImportNode, position: PositionState): boolean | R;
  exitImport?(node: ImportNode, position: PositionState): R;
  enterInput?(node: InputNode, position: PositionState): boolean | R;
  exitInput?(node: InputNode, position: PositionState): R;
  enterAsset?(node: AssetNode, position: PositionState): boolean | R;
  exitAsset?(node: AssetNode, position: PositionState): R;
  enterGroup?(node: GroupNode, position: PositionState): boolean | R;
  exitGroup?(node: GroupNode, position: PositionState): R;
}

export const walkGeneric = <TNode extends GenericNode, R = void>(
  node: TNode,
  visitor: GenericVisitor<TNode, R>,
  depth = 0,
  index = 0,
  siblingCount = 1,
): void => {
  const position: PositionState = {
    index,
    isFirst: index === 0,
    isLast: index === siblingCount - 1,
    depth,
    siblingCount,
  };

  const enter = visitor.enter;
  const recurse = enter?.(node, position) !== false;

  if (recurse && node.children?.length) {
    node.children.forEach((child, i, arr) => {
      visitor.enterChild?.(i === arr.length - 1);
      walkGeneric(child as TNode, visitor, depth + 1, i, arr.length);
      visitor.exitChild?.();
    });
  }

  visitor.exit?.(node, position);
};

export const walkGenericWithTypeDispatch = <
  TNode extends GenericNode,
  R = void,
>(
  node: TNode,
  visitor: GenericVisitor<TNode, R> & Record<string, any>,
  typeMap?: Record<string, string>,
  depth = 0,
  index = 0,
  siblingCount = 1,
): void => {
  const { type } = node.values;
  const methodSuffix =
    typeMap?.[type] || type.charAt(0).toUpperCase() + type.slice(1);

  const position: PositionState = {
    index,
    isFirst: index === 0,
    isLast: index === siblingCount - 1,
    depth,
    siblingCount,
  };

  const enterMethod = `enter${methodSuffix}`;
  const exitMethod = `exit${methodSuffix}`;

  const enter = visitor[enterMethod] as
    | ((node: TNode, position: PositionState) => boolean | R)
    | undefined;
  const recurse = enter?.(node, position) !== false;

  if (recurse && node.children?.length) {
    node.children.forEach((child, i, arr) => {
      visitor.enterChild?.(i === arr.length - 1);
      walkGenericWithTypeDispatch(
        child as TNode,
        visitor,
        typeMap,
        depth + 1,
        i,
        arr.length,
      );
      visitor.exitChild?.();
    });
  }

  const exit = visitor[exitMethod] as
    | ((node: TNode, position: PositionState) => R)
    | undefined;
  exit?.(node, position);
};

const BUNDLE_STATS_TYPE_MAP = {
  chunk: 'Chunk',
  import: 'Import',
  input: 'Input',
  asset: 'Asset',
  group: 'Group',
} as const;

export const walk = <R>(node: BundleStatsNode, visitor: FullVisitor<R>) => {
  walkGenericWithTypeDispatch(node, visitor as any, BUNDLE_STATS_TYPE_MAP);
};
