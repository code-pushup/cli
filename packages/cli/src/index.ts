import { pathToFileURL } from 'url';
import { cli } from './lib/cli';

export { cli };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) {
    throw new Error('Missing config file path');
  }
  cli(process.argv[2]).then(console.log).catch(console.error);
}
