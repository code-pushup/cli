import { ZodError } from 'zod';
import type { ConfigPatterns } from './models.js';
import { configPatternsSchema, interpolatedSlugSchema } from './schemas.js';

describe('interpolatedSlugSchema', () => {
  it('should accept a valid slug', () => {
    expect(interpolatedSlugSchema.parse('valid-slug')).toBe('valid-slug');
  });

  it('should accept a slug with {projectName} interpolation', () => {
    expect(interpolatedSlugSchema.parse('{projectName}-slug')).toBe(
      '{projectName}-slug',
    );
  });

  it('should reject an invalid slug that cannot be fixed by interpolation', () => {
    expect(() => interpolatedSlugSchema.parse('Invalid Slug!')).toThrow(
      ZodError,
    );
  });

  it('should reject a non-string value', () => {
    expect(() => interpolatedSlugSchema.parse(123)).toThrow(ZodError);
  });
});

describe('configPatternsSchema', () => {
  it('should accept valid persist and upload configs', () => {
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
    expect(configPatternsSchema.parse(configPatterns)).toEqual(configPatterns);
  });

  it('should accept persist config without upload', () => {
    const configPatterns: ConfigPatterns = {
      persist: {
        outputDir: '.code-pushup/{projectName}',
        filename: 'report',
        format: ['json', 'md'],
        skipReports: false,
      },
    };
    expect(configPatternsSchema.parse(configPatterns)).toEqual(configPatterns);
  });

  it('fills in default persist values if missing', () => {
    expect(
      configPatternsSchema.parse({
        persist: {
          filename: '{projectName}-report',
        },
      }),
    ).toEqual<ConfigPatterns>({
      persist: {
        outputDir: '.code-pushup',
        filename: '{projectName}-report',
        format: ['json', 'md'],
        skipReports: false,
      },
    });
  });

  it('should reject if persist is missing', () => {
    expect(() => configPatternsSchema.parse({})).toThrow(ZodError);
  });

  it('should reject if persist has invalid values', () => {
    expect(() =>
      configPatternsSchema.parse({
        persist: {
          format: 'json', // should be array
        },
      }),
    ).toThrow(ZodError);
  });

  it('should reject if upload is missing required fields', () => {
    expect(() =>
      configPatternsSchema.parse({
        persist: {
          outputDir: '.code-pushup/{projectName}',
          filename: 'report',
          format: ['json', 'md'],
          skipReports: false,
        },
        upload: {
          server: 'https://api.code-pushup.example.com/graphql',
          organization: 'example',
          project: '{projectName}',
          // missing apiKey
        },
      }),
    ).toThrow(ZodError);
  });
});
