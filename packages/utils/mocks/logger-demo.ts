import { coreConfigSchema, validate } from '@code-pushup/models';

async function sleep(delay: number) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

const errorStage = process.argv
  .findLast(arg => arg.startsWith('--error='))
  ?.split('=')[1];

const cwd = process.argv
  .findLast(arg => arg.startsWith('--cwd='))
  ?.split('=')[1];

try {
  await sleep(500);

  if (errorStage === 'config') {
    validate(coreConfigSchema, {}, { filePath: 'code-pushup.config.ts' });
  }

  await sleep(3000);
  if (errorStage === 'plugin') {
    throw new Error('Command npx eslint . --format=json exited with code 1');
  }

  await sleep(8000);

  await sleep(2000);
  if (errorStage === 'upload') {
    throw new Error('GraphQL error');
  }
} catch (error) {
  // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
  process.exit(1);
}
