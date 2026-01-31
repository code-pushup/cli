import { type AuditOutput, DEFAULT_PERSIST_CONFIG } from '@code-pushup/models';
import type {
  AxeResults,
  IncompleteResult,
  Result,
} from '../safe-axe-core-import.js';
import type { AxeUrlResult } from './run-axe.js';
import { createRunnerFunction } from './runner.js';
import * as setup from './setup.js';

const mockAnalyzeUrl = vi.fn();
const mockClose = vi.fn();
const mockCaptureAuthState = vi.fn();

vi.mock('./run-axe.js', () => ({
  AxeRunner: vi.fn().mockImplementation(() => ({
    analyzeUrl: mockAnalyzeUrl,
    close: mockClose,
    captureAuthState: mockCaptureAuthState,
  })),
}));

vi.mock('./setup.js', () => ({
  loadSetupScript: vi.fn(),
}));

describe('createRunnerFunction', () => {
  const mockLoadSetupScript = vi.mocked(setup.loadSetupScript);
  const mockSetupFn = vi.fn<[], Promise<void>>();

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
    const mockResult: AxeUrlResult = {
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('html-has-lang'),
      ],
    };
    mockAnalyzeUrl.mockResolvedValue(mockResult);

    const runnerFn = createRunnerFunction(['https://example.com'], [], 30_000);
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockAnalyzeUrl).toHaveBeenCalledWith({
      url: 'https://example.com',
      urlIndex: 0,
      urlsCount: 1,
      ruleIds: [],
      timeout: 30_000,
    });
    expect(mockClose).toHaveBeenCalled();
    expect(results).toEqual(mockResult.auditOutputs);
  });

  it('should handle multiple URLs and add index to audit slugs', async () => {
    const mockResult1: AxeUrlResult = {
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('html-has-lang'),
      ],
    };
    const mockResult2: AxeUrlResult = {
      url: 'https://another-example.org',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('color-contrast'),
      ],
    };

    mockAnalyzeUrl
      .mockResolvedValueOnce(mockResult1)
      .mockResolvedValueOnce(mockResult2);

    const runnerFn = createRunnerFunction(
      ['https://example.com', 'https://another-example.org'],
      [],
      30_000,
    );
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockAnalyzeUrl).toHaveBeenCalledTimes(2);
    expect(mockAnalyzeUrl).toHaveBeenNthCalledWith(1, {
      url: 'https://example.com',
      urlIndex: 0,
      urlsCount: 2,
      ruleIds: [],
      timeout: 30_000,
    });
    expect(mockAnalyzeUrl).toHaveBeenNthCalledWith(2, {
      url: 'https://another-example.org',
      urlIndex: 1,
      urlsCount: 2,
      ruleIds: [],
      timeout: 30_000,
    });
    expect(mockClose).toHaveBeenCalled();

    expect(results).toBeArrayOfSize(4);
    expect(results.map(({ slug }) => slug)).toEqual([
      'image-alt-1',
      'html-has-lang-1',
      'image-alt-2',
      'color-contrast-2',
    ]);
  });

  it('should run only specified rules when ruleIds filter is provided', async () => {
    const mockResult: AxeUrlResult = {
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [
        createMockAuditOutput('image-alt'),
        createMockAuditOutput('html-has-lang'),
      ],
    };
    mockAnalyzeUrl.mockResolvedValue(mockResult);

    const ruleIds = ['image-alt', 'html-has-lang'];
    const runnerFn = createRunnerFunction(
      ['https://example.com'],
      ruleIds,
      30_000,
    );
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockAnalyzeUrl).toHaveBeenCalledWith({
      url: 'https://example.com',
      urlIndex: 0,
      urlsCount: 1,
      ruleIds,
      timeout: 30_000,
    });
    expect(results).toEqual(mockResult.auditOutputs);
  });

  it('should continue with other URLs when one fails in multiple URL scenario', async () => {
    const mockResult: AxeUrlResult = {
      url: 'https://working.com',
      axeResults: mockAxeResults,
      auditOutputs: [createMockAuditOutput('image-alt')],
    };

    mockAnalyzeUrl
      .mockRejectedValueOnce(new Error('Failed to load page'))
      .mockResolvedValueOnce(mockResult);

    const runnerFn = createRunnerFunction(
      ['https://broken.com', 'https://working.com'],
      [],
      30_000,
    );
    const results = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockAnalyzeUrl).toHaveBeenCalledTimes(2);
    expect(mockClose).toHaveBeenCalled();
    expect(results).toBeArrayOfSize(1);
    expect(results[0]!.slug).toBe('image-alt-2');
  });

  it('should throw error if all URLs fail in multiple URL scenario', async () => {
    mockAnalyzeUrl.mockRejectedValue(new Error('Failed to load page'));

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
    mockAnalyzeUrl.mockRejectedValue(new Error('Failed to load page'));

    const runnerFn = createRunnerFunction(['https://example.com'], [], 30_000);

    await expect(runnerFn({ persist: DEFAULT_PERSIST_CONFIG })).rejects.toThrow(
      'Axe did not produce any results.',
    );
  });

  it('should run setup when setupScript is provided', async () => {
    mockLoadSetupScript.mockResolvedValue(mockSetupFn);
    mockAnalyzeUrl.mockResolvedValue({
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [createMockAuditOutput('image-alt')],
    });

    const runnerFn = createRunnerFunction(
      ['https://example.com'],
      [],
      30_000,
      './setup.ts',
    );
    await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockLoadSetupScript).toHaveBeenCalledWith('./setup.ts');
    expect(mockCaptureAuthState).toHaveBeenCalledOnce();
    expect(mockCaptureAuthState).toHaveBeenCalledWith(mockSetupFn, 30_000);
  });

  it('should skip setup when setupScript is undefined', async () => {
    mockAnalyzeUrl.mockResolvedValue({
      url: 'https://example.com',
      axeResults: mockAxeResults,
      auditOutputs: [createMockAuditOutput('image-alt')],
    });

    const runnerFn = createRunnerFunction(['https://example.com'], [], 30_000);
    await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });

    expect(mockLoadSetupScript).not.toHaveBeenCalled();
    expect(mockCaptureAuthState).not.toHaveBeenCalled();
  });
});
