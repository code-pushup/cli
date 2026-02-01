import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import axePlugin from '@code-pushup/axe-plugin';
import type { CoreConfig } from '@code-pushup/models';

const htmlFile = join(process.cwd(), 'index.html');
const url = pathToFileURL(htmlFile).href;

export default {
  plugins: [axePlugin(url)],
} satisfies CoreConfig;
