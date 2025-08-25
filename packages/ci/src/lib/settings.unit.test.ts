import type { CoreConfig } from '@code-pushup/models';
import type { ConfigPatterns } from './models.js';
import { parseConfigPatternsFromString } from './settings.js';

describe('parseConfigPatternsFromString', () => {
  it('should return for empty string', () => {
    expect(parseConfigPatternsFromString('')).toBeNull();
  });

  it('should parse full persist and upload configs', () => {
    const configPatterns: Required<ConfigPatterns> = {
      persist: {
        outputDir: '.code-pushup/{projectName}',
        filename: 'report',
        format: ['json', 'md'],
        skipReports: false,
      },
      upload: {
        server: 'https://api.code-pushup.example.com/graphql',
        apiKey: 'cp_...',
        organization: 'example',
        project: '{projectName}',
      },
    };
    expect(
      parseConfigPatternsFromString(JSON.stringify(configPatterns)),
    ).toEqual(configPatterns);
  });

  it('should parse full persist config without upload config', () => {
    const configPatterns: ConfigPatterns = {
      persist: {
        outputDir: '.code-pushup/{projectName}',
        filename: 'report',
        format: ['json', 'md'],
        skipReports: false,
      },
    };
    expect(
      parseConfigPatternsFromString(JSON.stringify(configPatterns)),
    ).toEqual(configPatterns);
  });

  it('should fill in default persist values where missing', () => {
    expect(
      parseConfigPatternsFromString(
        JSON.stringify({
          persist: {
            filename: '{projectName}-report',
          },
        } satisfies Pick<CoreConfig, 'persist'>),
      ),
    ).toEqual<ConfigPatterns>({
      persist: {
        outputDir: '.code-pushup',
        filename: '{projectName}-report',
        format: ['json', 'md'],
        skipReports: false,
      },
    });
  });

  it('should throw if input string is not valid JSON', () => {
    expect(() =>
      parseConfigPatternsFromString('outputDir: .code-pushup/{projectName}'),
    ).toThrow('Invalid JSON value for configPatterns input - Unexpected token');
  });

  it('should throw if persist config is missing', () => {
    expect(() => parseConfigPatternsFromString('{}')).toThrow(
      /Invalid shape of configPatterns input.*expected object, received undefined.*at persist/s,
    );
  });

  it('should throw if persist config has invalid values', () => {
    expect(() =>
      parseConfigPatternsFromString(
        JSON.stringify({ persist: { format: 'json' } }),
      ),
    ).toThrow(
      /Invalid shape of configPatterns input.*expected array, received string.*at persist\.format/s,
    );
  });

  it('should throw if upload config has missing values', () => {
    expect(() =>
      parseConfigPatternsFromString(
        JSON.stringify({
          persist: {},
          upload: {
            server: 'https://api.code-pushup.example.com/graphql',
            organization: 'example',
            project: '{projectName}',
          },
        }),
      ),
    ).toThrow(
      /Invalid shape of configPatterns input.*expected string, received undefined.*at upload\.apiKey/s,
    );
  });
});
