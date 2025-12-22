import type { AxePreset } from './config.js';

export const AXE_PLUGIN_SLUG = 'axe';
export const AXE_PLUGIN_TITLE = 'Axe';

export const AXE_DEFAULT_PRESET = 'wcag21aa';

export const DEFAULT_TIMEOUT_MS = 30_000;

export const AXE_PRESET_NAMES: Record<AxePreset, string> = {
  wcag21aa: 'WCAG 2.1 AA',
  wcag22aa: 'WCAG 2.2 AA',
  'best-practice': 'Best practices',
  all: 'All',
};
