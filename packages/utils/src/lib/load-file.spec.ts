import { join } from 'path';
import * as process from 'process';
import { NoExportError, NoFileError, importEsmModule } from '../lib/load-file';

const getFilepath = (fileName: string) =>
  join(process.cwd(), 'packages', 'utils', 'test', 'fixtures', fileName);
describe('importEsmModule', () => {
  it('should load file', async () => {
    const module = await importEsmModule<{ name: string }>({
      filepath: getFilepath('valid-export.mjs'),
    });
    expect(module).toBe('valid-export');
  });

  it('should throw if file does not exisit', async () => {
    await expect(
      importEsmModule<{ name: string }>({
        filepath: join('invalid-path', 'valid-export.mjs'),
      }),
    ).rejects.toThrow(
      new NoFileError(join('invalid-path', 'valid-export.mjs')).message,
    );
  });

  it('should throw if export is not defined', async () => {
    const filepath = getFilepath('no-export.mjs');
    await expect(
      importEsmModule<{ name: string }>({
        filepath,
      }),
    ).rejects.toThrow(new NoExportError(filepath));
  });

  it('should throw if export is undefined defined', async () => {
    const filepath = getFilepath('undefined-export.mjs');
    await expect(
      importEsmModule<{ name: string }>({
        filepath,
      }),
    ).rejects.toThrow(new NoExportError(filepath));
  });
});
