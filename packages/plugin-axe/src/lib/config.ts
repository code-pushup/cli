import { z } from 'zod';
import {
  pluginScoreTargetsSchema,
  positiveIntSchema,
} from '@code-pushup/models';
import { AXE_DEFAULT_PRESET, AXE_PRESETS } from './constants.js';

const DEFAULT_TIMEOUT_MS = 30_000;

export const axePluginOptionsSchema = z
  .object({
    preset: z.enum(AXE_PRESETS).default(AXE_DEFAULT_PRESET).meta({
      description:
        'Accessibility ruleset preset (default: wcag21aa for WCAG 2.1 Level AA compliance)',
    }),
    scoreTargets: pluginScoreTargetsSchema.optional(),
    timeout: positiveIntSchema.default(DEFAULT_TIMEOUT_MS).meta({
      description:
        'Page navigation timeout in milliseconds (default: 30000ms / 30s)',
    }),
  })
  .meta({
    title: 'AxePluginOptions',
    description: 'Configuration options for the Axe plugin',
  });

export type AxePluginOptions = z.input<typeof axePluginOptionsSchema>;
