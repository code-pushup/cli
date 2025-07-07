// Bundle Stats Type Definitions

export type SupportedImportKind = 'static' | 'dynamic';

export interface BaseNodeValues {
  type: 'chunk' | 'input' | 'asset' | 'import' | 'group';
  path: string;
  bytes?: number;
  childCount?: number;
  icon?: string;
}

export interface ChunkValues extends BaseNodeValues {
  type: 'chunk';
  isEntryFile?: boolean;
  label?: string;
}

export interface InputValues extends BaseNodeValues {
  type: 'input';
  totalSize?: number;
}

export interface AssetValues extends BaseNodeValues {
  type: 'asset';
  label?: string;
  totalSize?: number;
}

export interface ImportValues extends BaseNodeValues {
  type: 'import';
  importKind: SupportedImportKind;
  totalSize?: number;
}

export interface GroupValues extends BaseNodeValues {
  type: 'group';
}

export type NodeValues =
  | ChunkValues
  | InputValues
  | AssetValues
  | ImportValues
  | GroupValues;

export interface BundleStatsNode {
  name: string;
  values: NodeValues;
  children?: BundleStatsNode[];
}

export interface ChunkNode extends BundleStatsNode {
  values: ChunkValues;
}

export interface InputNode extends BundleStatsNode {
  values: InputValues;
}

export interface AssetNode extends BundleStatsNode {
  values: AssetValues;
}

export interface ImportNode extends BundleStatsNode {
  values: ImportValues;
}

export interface GroupNode extends BundleStatsNode {
  values: GroupValues;
}

export interface BundleStatsTree {
  title: string;
  type: 'basic';
  root: BundleStatsNode;
}
