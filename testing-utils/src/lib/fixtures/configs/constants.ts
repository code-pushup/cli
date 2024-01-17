export const CORE_CONFIG_NAMES = [
  'minimal' as const,
  'persist' as const,
  'persist-only-filename' as const,
];
export type CoreConfigName = (typeof CORE_CONFIG_NAMES)[number];
