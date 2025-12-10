import { z } from 'zod';
import { validate } from '@code-pushup/models';
import { axePresetSchema } from './config.js';

/* WCAG presets for rule loading */
const axeWcagTags = [
  'wcag2a',
  'wcag21a',
  'wcag2aa',
  'wcag21aa',
  'wcag22aa',
] as const;

export const axeWcagTagSchema = z
  .enum(axeWcagTags)
  .meta({ title: 'AxeWcagTag' });

export type AxeWcagTag = z.infer<typeof axeWcagTagSchema>;

export const axeWcagPresetSchema = axePresetSchema
  .extract(['wcag21aa', 'wcag22aa'])
  .meta({ title: 'AxeWcagPreset' });

export type AxeWcagPreset = z.infer<typeof axeWcagPresetSchema>;

const WCAG_PRESET_TAGS: Record<AxeWcagPreset, AxeWcagTag[]> = {
  wcag21aa: ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'],
  wcag22aa: ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
};

export function getWcagPresetTags(preset: AxeWcagPreset): AxeWcagTag[] {
  return WCAG_PRESET_TAGS[preset];
}

/* Category groups for all presets */
const axeCategoryGroupSlugs = [
  'aria',
  'color',
  'forms',
  'keyboard',
  'language',
  'name-role-value',
  'parsing',
  'semantics',
  'sensory-and-visual-cues',
  'structure',
  'tables',
  'text-alternatives',
  'time-and-media',
] as const;

export const axeCategoryGroupSlugSchema = z
  .enum(axeCategoryGroupSlugs)
  .meta({ title: 'AxeCategoryGroupSlug' });

export type AxeCategoryGroupSlug = z.infer<typeof axeCategoryGroupSlugSchema>;

export const CATEGORY_GROUPS: Record<AxeCategoryGroupSlug, string> = {
  aria: 'ARIA',
  color: 'Color & Contrast',
  forms: 'Forms',
  keyboard: 'Keyboard',
  language: 'Language',
  'name-role-value': 'Names & Labels',
  parsing: 'Parsing',
  semantics: 'Semantics',
  'sensory-and-visual-cues': 'Visual Cues',
  structure: 'Structure',
  tables: 'Tables',
  'text-alternatives': 'Text Alternatives',
  'time-and-media': 'Media',
};

export function isAxeGroupSlug(slug: unknown): slug is AxeCategoryGroupSlug {
  try {
    validate(axeCategoryGroupSlugSchema, slug);
    return true;
  } catch {
    return false;
  }
}

/* Combined exports */
export const axeGroupSlugSchema = axeCategoryGroupSlugSchema;
export type AxeGroupSlug = AxeCategoryGroupSlug;
