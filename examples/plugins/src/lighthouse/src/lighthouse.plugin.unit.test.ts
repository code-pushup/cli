import { describe, expect, it } from 'vitest';
import { LIGHTHOUSE_OUTPUT_FILE_DEFAULT } from './constants.js';
import { runnerConfig } from './lighthouse.plugin.js';

describe('lighthouse-runnerConfig', () => {
  it('should execute if url is given', () => {
    expect(
      runnerConfig({
        url: 'http://localhost:8080',
      }),
    ).toEqual(
      expect.objectContaining({
        args: expect.arrayContaining(['lighthouse', 'http://localhost:8080']),
        command: 'npx',
        outputFile: LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
      }),
    );
  });

  it('should execute with output "json" and output-path "lighthouse-report.json" by default', () => {
    expect(
      runnerConfig({
        url: 'http://localhost:8080',
      }),
    ).toEqual(
      expect.objectContaining({
        args: expect.arrayContaining([
          '--output="json"',
          `--output-path="${LIGHTHOUSE_OUTPUT_FILE_DEFAULT}"`,
        ]),
        command: 'npx',
        outputFile: LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
        outputTransform: expect.any(Function),
      }),
    );
  });

  it('should run only audits included in given onlyAudits', () => {
    expect(
      runnerConfig({
        url: 'http://localhost:8080',
        onlyAudits: ['largest-contentful-paint'],
      }),
    ).toEqual(
      expect.objectContaining({
        args: expect.arrayContaining([
          '--onlyAudits="largest-contentful-paint"',
        ]),
      }),
    );
  });

  it('should parse options for headless by default to false', () => {
    const args = runnerConfig({
      url: 'http://localhost:8080',
    });
    expect(args).toEqual(
      expect.not.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should run headless "new" if set to true', () => {
    expect(
      runnerConfig({
        url: 'http://localhost:8080',
        headless: 'new',
      }),
    ).toEqual(
      expect.objectContaining({
        args: expect.arrayContaining(['--chrome-flags="--headless=new"']),
      }),
    );
  });
});
