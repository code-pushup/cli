import { z } from 'zod';

const defaultSchema = z.object({
  command: z.string().describe('Command to execute'),
  verbose: z.boolean().optional().describe('Enable verbose output'),
  config: z.string().optional().describe('Path to config file'),
});

export default defaultSchema;
