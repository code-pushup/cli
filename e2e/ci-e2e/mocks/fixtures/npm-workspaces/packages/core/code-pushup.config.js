import { DEFAULT_CATEGORIES } from '../../code-pushup/categories.js';
import tsMigrationPlugin from '../../code-pushup/ts-migration.plugin.js';

export default {
  plugins: [tsMigrationPlugin(import.meta.url)],
  categories: DEFAULT_CATEGORIES,
};
