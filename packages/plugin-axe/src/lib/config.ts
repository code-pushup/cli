import { z } from 'zod';
import { pluginScoreTargetsSchema } from '@code-pushup/models';
import { AXE_DEFAULT_PRESET, AXE_PRESETS } from './constants';

export const axePluginOptionsSchema = z
  .object({
    preset: z.enum(AXE_PRESETS).default(AXE_DEFAULT_PRESET).meta({
      description:
        'Accessibility ruleset preset (default: wcag21aa for WCAG 2.1 Level AA compliance)',
    }),
    scoreTargets: pluginScoreTargetsSchema.optional(),
  })
  .meta({
    title: 'AxePluginOptions',
    description: 'Configuration options for the Axe plugin',
  });

export type AxePluginOptions = z.input<typeof axePluginOptionsSchema>;
