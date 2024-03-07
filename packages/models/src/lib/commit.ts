import { z } from 'zod';

export const commitSchema = z.object(
  {
    hash: z
      .string({ description: 'Commit SHA (full)' })
      .regex(
        /^[\da-f]{40}$/,
        'Commit SHA should be a 40-character hexadecimal string',
      ),
    message: z.string({ description: 'Commit message' }),
    date: z.coerce.date({
      description: 'Date and time when commit was authored',
    }),
    author: z
      .string({
        description: 'Commit author name',
      })
      .trim(),
  },
  { description: 'Git commit' },
);

export type Commit = z.infer<typeof commitSchema>;
