import { z } from 'zod';
import {
  filePathSchema,
  filePositionSchema,
  urlSchema,
} from './implementation/schemas.js';

export const sourceFileLocationSchema = z
  .object({
    file: filePathSchema.meta({
      description: 'Relative path to source file in Git repo',
    }),
    position: filePositionSchema.optional(),
  })
  .meta({
    title: 'SourceFileLocation',
    description: 'Source file location',
  });

export type SourceFileLocation = z.infer<typeof sourceFileLocationSchema>;

export const sourceUrlLocationSchema = z
  .object({
    url: urlSchema.meta({
      description: 'URL of the web page where the issue was found',
    }),
    snippet: z.string().optional().meta({
      description: 'HTML snippet of the element',
    }),
    selector: z.string().optional().meta({
      description: 'CSS selector to locate the element',
    }),
  })
  .meta({
    title: 'SourceUrlLocation',
    description: 'Location of a DOM element in a web page',
  });

export type SourceUrlLocation = z.infer<typeof sourceUrlLocationSchema>;

export const issueSourceSchema = z
  .union([sourceFileLocationSchema, sourceUrlLocationSchema])
  .meta({
    title: 'IssueSource',
    description: 'Source location of an issue (file path or URL)',
  });

export type IssueSource = z.infer<typeof issueSourceSchema>;
