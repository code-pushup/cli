import { TsupExecutorSchema } from './schema';

export default async function runExecutor(options: TsupExecutorSchema) {
  console.log('Executor ran for Tsup', options);
  return {
    success: true,
  };
}
