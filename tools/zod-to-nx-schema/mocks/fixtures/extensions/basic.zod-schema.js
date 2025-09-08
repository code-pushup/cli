import { z } from 'zod';

export default z.object({
  name: z.string().describe('The name of the item'),
});
