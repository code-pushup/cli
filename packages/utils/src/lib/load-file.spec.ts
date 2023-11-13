import { join } from 'path';
import * as process from 'process';
import { NoExportError, importEsmModule } from '../lib/load-file';

const getFilepath = (fileName: string) =>
  join(process.cwd(), 'packages', 'utils', 'test', 'fixtures', fileName);
describe('importEsmModule', () => {
  it('should load file', async () => {
    const module = await importEsmModule<{ name: string }>({
      filepath: getFilepath('valid-export.mjs'),
    });
    expect(module).toBe('valid-export');
  });

  it('should throw if file does not exist', async () => {
    await expect(
      importEsmModule<{ name: string }>({
        filepath: join('invalid-path', 'not-existing-export.mjs'),
      }),
    ).rejects.toThrow('not-existing-export.mjs');
  });

  it('should throw if export is not defined', async () => {
    const filepath = getFilepath('no-export.mjs');
    await expect(
      importEsmModule<{ name: string }>({
        filepath,
      }),
    ).rejects.toThrow(new NoExportError(filepath));
  });

  it('should throw if export is undefined', async () => {
    const filepath = getFilepath('undefined-export.mjs');
    await expect(
      importEsmModule<{ name: string }>({
        filepath,
      }),
    ).rejects.toThrow(new NoExportError(filepath));
  });
});
