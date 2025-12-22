import type { AxeResults, IncompleteResult, Result } from 'axe-core';
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
  const mockAxeResults = {
    passes: [] as Result[],
    violations: [] as Result[],
    incomplete: [] as IncompleteResult[],
    inapplicable: [] as Result[],
  } as AxeResults;

  it('should handle single URL without adding index to audit slugs', async () => {
    const mockResult: runAxe.AxeUrlResult = {
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('html-has-lang'),
      ],
    };
    mockRunAxeForUrl.mockResolvedValue(mockResult);

    const runnerFn = createRunnerFunction(['https://example.com'], [], 30_000);
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockRunAxeForUrl).toHaveBeenCalledWith({
      url: 'https://example.com',
      urlIndex: 0,
      urlsCount: 1,
      ruleIds: [],
      timeout: 30_000,
    });
    expect(mockCloseBrowser).toHaveBeenCalled();
    expect(results).toEqual(mockResult.auditOutputs);
  });

  it('should handle multiple URLs and add index to audit slugs', async () => {
    const mockResult1: runAxe.AxeUrlResult = {
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('html-has-lang'),
      ],
    };
    const mockResult2: runAxe.AxeUrlResult = {
      url: 'https://another-example.org',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('color-contrast'),
      ],
    };

    mockRunAxeForUrl
      .mockResolvedValueOnce(mockResult1)
      .mockResolvedValueOnce(mockResult2);

    const runnerFn = createRunnerFunction(
      ['https://example.com', 'https://another-example.org'],
      [],
      30_000,
    );
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockRunAxeForUrl).toHaveBeenCalledTimes(2);
    expect(mockRunAxeForUrl).toHaveBeenNthCalledWith(1, {
      url: 'https://example.com',
      urlIndex: 0,
      urlsCount: 2,
      ruleIds: [],
      timeout: 30_000,
    } satisfies runAxe.AxeUrlArgs);
    expect(mockRunAxeForUrl).toHaveBeenNthCalledWith(2, {
      url: 'https://another-example.org',
      urlIndex: 1,
      urlsCount: 2,
      ruleIds: [],
      timeout: 30_000,
    } satisfies runAxe.AxeUrlArgs);
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
    const mockResult: runAxe.AxeUrlResult = {
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('html-has-lang'),
      ],
    };
    mockRunAxeForUrl.mockResolvedValue(mockResult);

    const ruleIds = ['image-alt', 'html-has-lang'];
    const runnerFn = createRunnerFunction(
      ['https://example.com'],
      ruleIds,
      30_000,
    );
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockRunAxeForUrl).toHaveBeenCalledWith({
      url: 'https://example.com',
      urlIndex: 0,
      urlsCount: 1,
      ruleIds,
      timeout: 30_000,
    });
    expect(results).toEqual(mockResult.auditOutputs);
  });

  it('should continue with other URLs when one fails in multiple URL scenario', async () => {
    const mockResult: runAxe.AxeUrlResult = {
      url: 'https://working.com',
      axeResults: mockAxeResults,
      auditOutputs: [createMockAuditOutput('image-alt')],
    };

    mockRunAxeForUrl
      .mockRejectedValueOnce(new Error('Failed to load page'))
      .mockResolvedValueOnce(mockResult);

    const runnerFn = createRunnerFunction(
      ['https://broken.com', 'https://working.com'],
      [],
      30_000,
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
      30_000,
    );

    await expect(runnerFn({ persist: DEFAULT_PERSIST_CONFIG })).rejects.toThrow(
      'Axe failed to produce results for all URLs.',
    );
  });

  it('should throw error when single URL fails', async () => {
    mockRunAxeForUrl.mockRejectedValue(new Error('Failed to load page'));

    const runnerFn = createRunnerFunction(['https://example.com'], [], 30_000);

    await expect(runnerFn({ persist: DEFAULT_PERSIST_CONFIG })).rejects.toThrow(
      'Axe did not produce any results.',
    );
  });
});
