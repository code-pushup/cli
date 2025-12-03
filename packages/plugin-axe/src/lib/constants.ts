export const AXE_PLUGIN_SLUG = 'axe';

export const AXE_PRESETS = [
  'wcag21aa',
  'wcag22aa',
  'best-practice',
  'all',
] as const;

export type AxePreset = (typeof AXE_PRESETS)[number];

export const AXE_DEFAULT_PRESET: AxePreset = 'wcag21aa';
