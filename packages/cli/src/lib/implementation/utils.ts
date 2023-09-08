import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const getDirname = (import_meta_url: string) =>
  dirname(fileURLToPath(import_meta_url));
