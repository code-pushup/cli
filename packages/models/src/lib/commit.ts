import { z } from 'zod';

export const commitSchema = z
  .object({
    hash: z
      .string()
      .regex(
        /^[\da-f]{40}$/,
        'Commit SHA should be a 40-character hexadecimal string',
      )
      .describe('Commit SHA (full)'),
    message: z.string().describe('Commit message'),
    date: z.coerce.date().describe('Date and time when commit was authored'),
    author: z.string().trim().describe('Commit author name'),
  })
  .describe('Git commit');

export type Commit = z.infer<typeof commitSchema>;
