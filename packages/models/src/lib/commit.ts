import { z } from 'zod';

export const commitSchema = z
  .object({
    hash: z
      .string()
      .regex(
        /^[\da-f]{40}$/,
        'Commit SHA should be a 40-character hexadecimal string',
      )
      .meta({ description: 'Commit SHA (full)' }),
    message: z.string().meta({ description: 'Commit message' }),
    date: z.coerce
      .date()
      .meta({ description: 'Date and time when commit was authored' }),
    author: z.string().trim().meta({ description: 'Commit author name' }),
  })
  .meta({
    title: 'Commit',
    description: 'Git commit',
  });

export type Commit = z.infer<typeof commitSchema>;
