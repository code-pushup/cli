import { z } from 'zod';

const defaultSchema = z.object({
  command: z.string().meta({
    describe: 'Command to execute',
  }),
});

export default defaultSchema;
