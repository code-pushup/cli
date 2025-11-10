import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuditOutput, DEFAULT_PERSIST_CONFIG } from '@code-pushup/models';
import * as runAxe from './run-axe.js';
import { createRunnerFunction } from './runner.js';

vi.mock('./run-axe.js', () => ({
  runAxeForUrl: vi.fn(),
  closeBrowser: vi.fn(),
}));

describe('createRunnerFunction', () => {
  const mockRunAxeForUrl = vi.mocked(runAxe.runAxeForUrl);
  const mockCloseBrowser = vi.mocked(runAxe.closeBrowser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockAuditOutput = (slug: string, score = 1): AuditOutput => ({
    slug,
    score,
    value: 0,
    displayValue: 'No violations found',
  });

  it('should handle single URL without adding index to audit slugs', async () => {
    const mockResults = [
      createMockAuditOutput('image-alt'),
      createMockAuditOutput('html-has-lang'),
    ];
    mockRunAxeForUrl.mockResolvedValue(mockResults);

    const runnerFn = createRunnerFunction(['https://example.com'], []);
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockRunAxeForUrl).toHaveBeenCalledWith('https://example.com', []);
    expect(mockCloseBrowser).toHaveBeenCalled();
    expect(results).toEqual(mockResults);
  });

  it('should handle multiple URLs and add index to audit slugs', async () => {
    const mockResults1 = [
      createMockAuditOutput('image-alt'),
      createMockAuditOutput('html-has-lang'),
    ];
    const mockResults2 = [
      createMockAuditOutput('image-alt'),
      createMockAuditOutput('color-contrast'),
    ];

    mockRunAxeForUrl
      .mockResolvedValueOnce(mockResults1)
      .mockResolvedValueOnce(mockResults2);

    const runnerFn = createRunnerFunction(
      ['https://example.com', 'https://another-example.org'],
      [],
    );
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockRunAxeForUrl).toHaveBeenCalledTimes(2);
    expect(mockRunAxeForUrl).toHaveBeenNthCalledWith(
      1,
      'https://example.com',
      [],
    );
    expect(mockRunAxeForUrl).toHaveBeenNthCalledWith(
      2,
      'https://another-example.org',
      [],
    );
    expect(mockCloseBrowser).toHaveBeenCalled();

    expect(results).toBeArrayOfSize(4);
    expect(results.map(({ slug }) => slug)).toEqual([
      'image-alt-1',
      'html-has-lang-1',
      'image-alt-2',
      'color-contrast-2',
    ]);
  });

  it('should run only specified rules when ruleIds filter is provided', async () => {
    const mockResults = [
      createMockAuditOutput('image-alt'),
      createMockAuditOutput('html-has-lang'),
    ];
    mockRunAxeForUrl.mockResolvedValue(mockResults);

    const ruleIds = ['image-alt', 'html-has-lang'];
    const runnerFn = createRunnerFunction(['https://example.com'], ruleIds);
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockRunAxeForUrl).toHaveBeenCalledWith(
      'https://example.com',
      ruleIds,
    );
    expect(results).toEqual(mockResults);
  });

  it('should continue with other URLs when one fails in multiple URL scenario', async () => {
    const mockResults = [createMockAuditOutput('image-alt')];

    mockRunAxeForUrl
      .mockRejectedValueOnce(new Error('Failed to load page'))
      .mockResolvedValueOnce(mockResults);

    const runnerFn = createRunnerFunction(
      ['https://broken.com', 'https://working.com'],
      [],
    );
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockRunAxeForUrl).toHaveBeenCalledTimes(2);
    expect(mockCloseBrowser).toHaveBeenCalled();
    expect(results).toBeArrayOfSize(1);
    expect(results[0]!.slug).toBe('image-alt-2');
  });

  it('should throw error if all URLs fail in multiple URL scenario', async () => {
    mockRunAxeForUrl.mockRejectedValue(new Error('Failed to load page'));

    const runnerFn = createRunnerFunction(
      ['https://example.com', 'https://another-example.com'],
      [],
    );

    await expect(runnerFn({ persist: DEFAULT_PERSIST_CONFIG })).rejects.toThrow(
      'Axe failed to produce results for all URLs.',
    );
  });

  it('should throw error when single URL fails', async () => {
    mockRunAxeForUrl.mockRejectedValue(new Error('Failed to load page'));

    const runnerFn = createRunnerFunction(['https://example.com'], []);

    await expect(runnerFn({ persist: DEFAULT_PERSIST_CONFIG })).rejects.toThrow(
      'Axe did not produce any results.',
    );
  });
});
