export const CORE_CONFIG_NAMES = [
  'minimal',
  'persist',
  'persist-only-filename',
] as const;
export type CoreConfigName = (typeof CORE_CONFIG_NAMES)[number];
