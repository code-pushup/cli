import { describe, expect, it } from 'vitest';
import { formatBytes } from './utils';

describe('formatBytes', () => {
  it('should log file sizes in Bytes`', async () => {
    expect(formatBytes(1000)).toBe('1000 Bytes');
  });

  it('should log file sizes in KB`', async () => {
    expect(formatBytes(10000)).toBe('9.77 KB');
  });

  it('should log file sizes in MB`', async () => {
    expect(formatBytes(10000000)).toBe('9.54 MB');
  });

  it('should log file sizes in bytes`', async () => {
    expect(formatBytes(10000000000)).toBe('9.31 GB');
  });

  it('should log file sizes in TB`', async () => {
    expect(formatBytes(10000000000000)).toBe('9.09 TB');
  });

  it('should log file sizes in PB`', async () => {
    expect(formatBytes(10000000000000000)).toBe('8.88 PB');
  });

  it('should log file sizes in EB`', async () => {
    expect(formatBytes(10000000000000000000)).toBe('8.67 EB');
  });

  it('should log file sizes in ZB`', async () => {
    expect(formatBytes(10000000000000000000000)).toBe('8.47 ZB');
  });

  it('should log file sizes in YB`', async () => {
    expect(formatBytes(10000000000000000000000000)).toBe('8.27 YB');
  });

  it('should log file sizes correctly with correct decimal`', async () => {
    expect(formatBytes(10000, 1)).toBe('9.8 KB');
  });

  it('should log file sizes of 0 if no size is given`', async () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });
});
