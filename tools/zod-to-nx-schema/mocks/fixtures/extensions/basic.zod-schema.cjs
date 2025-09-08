const { z } = require('zod');

module.exports = z.object({
  name: z.string().describe('The name of the item'),
});
