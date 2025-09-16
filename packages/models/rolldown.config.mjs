import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src/lib',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
    },
    {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src/lib',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name].cjs',
    },
  ],
  external: ['zod', 'vscode-material-icons'],
});
