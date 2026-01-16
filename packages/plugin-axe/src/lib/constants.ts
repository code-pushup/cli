import type { AxePreset } from './config.js';

/** Unique identifier for the Axe plugin. */
export const AXE_PLUGIN_SLUG = 'axe';

/** Display title for the Axe plugin. */
export const AXE_PLUGIN_TITLE = 'Axe';

/** Default WCAG preset used when none is specified. */
export const AXE_DEFAULT_PRESET = 'wcag21aa';

/** Default timeout in milliseconds for page operations. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Human-readable names for each Axe preset. */
export const AXE_PRESET_NAMES: Record<AxePreset, string> = {
  wcag21aa: 'WCAG 2.1 AA',
  wcag22aa: 'WCAG 2.2 AA',
  'best-practice': 'Best practices',
  all: 'All',
};
