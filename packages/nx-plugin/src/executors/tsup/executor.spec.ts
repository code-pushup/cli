import { TsupExecutorSchema } from './schema';
import executor from './executor';

const options: TsupExecutorSchema = {};

describe('Tsup Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
