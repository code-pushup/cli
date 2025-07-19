import type { ArtefactType } from './utils/grouping';

// ===== ARTEFACT TYPE DEFINITIONS =====

export const ARTEFACT_TYPE_ICON_MAP: Record<ArtefactType, string> = {
  root: '🗂️',
  'script-file': '📄',
  'style-file': '🎨',
  'entry-file': '📍',
  'static-import': '🔗',
  group: '📁',
};

// ===== TREE CONFIGURATION =====

export const DEFAULT_PRUNING_OPTIONS = {
  maxDepth: 3,
  maxChildren: 5,
  minSize: 0,
} as const;

// ===== ISSUE ICONS =====

export const ISSUE_ICONS = {
  TOO_LARGE: '🔺',
  TOO_SMALL: '🔻',
  BLACKLIST: '🚫',
} as const;

// ===== DEFAULT VALUES =====

export const DEFAULT_GROUP_NAME = 'Group';
export const REST_GROUP_NAME = 'Rest';
