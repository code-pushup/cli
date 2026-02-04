import {
  type AuditOutput,
  type AuditOutputs,
  auditOutputSchema,
  auditOutputsSchema,
} from './audit-output.js';

describe('auditOutputSchema', () => {
  it('should accept a valid audit output without details', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'cypress-e2e-test-results',
        score: 0.8,
        value: 80,
        displayValue: '80 %',
      } satisfies AuditOutput),
    ).not.toThrow();
  });

  it('should accept a valid audit output with details issues', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'speed-index',
        score: 0.3,
        value: 4500,
        displayValue: '4.5 s',
        details: {
          issues: [
            {
              message: 'The progress chart was blocked for 4 seconds.',
              severity: 'info',
            },
          ],
        },
      } satisfies AuditOutput),
    ).not.toThrow();
  });

  it('should accept a valid audit output with details table', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'largest-contentful-paint',
        score: 0.83,
        value: 3090,
        displayValue: '3.1 s',
        details: {
          table: {
            rows: [
              {
                selector:
                  '#title-card-3-1 > div.ptrack-content > a > div > img',
                html: '<img class="boxart-image boxart-image-in-padded-container" src="https://my.images/P93zeAjL9blBKk5xKz.jpg?r=942" alt="How to change your mind">',
              },
            ],
          },
        },
      } satisfies AuditOutput),
    ).not.toThrow();
  });

  it('should accept a valid audit output with details table and issues', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'speed-index',
        score: 0.3,
        value: 4500,
        displayValue: '4.5 s',
        details: {
          issues: [
            {
              message: 'The progress chart was blocked for 4 seconds.',
              severity: 'info',
            },
          ],
          table: {
            rows: [
              {
                selector:
                  '#title-card-3-1 > div.ptrack-content > a > div > img',
                html: '<img class="boxart-image boxart-image-in-padded-container" src="https://my.images/P93zeAjL9blBKk5xKz.jpg?r=942" alt="How to change your mind">',
              },
            ],
          },
        },
      } satisfies AuditOutput),
    ).not.toThrow();
  });

  it('should accept a valid audit output with a score target', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'total-blocking-time',
        score: 0.91,
        scoreTarget: 0.9,
        value: 183.5,
        displayValue: '180 ms',
      } satisfies AuditOutput),
    ).not.toThrow();
  });

  it('should accept a decimal value', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'first-meaningful-paint',
        score: 1,
        value: 883.4785,
      } satisfies AuditOutput),
    ).not.toThrow();
  });

  it('should throw for a negative value', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'speed-index',
        score: 1,
        value: -100,
      } satisfies AuditOutput),
    ).toThrow('too_small');
  });

  it('should throw for a score outside 0-1 range', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'maximum-layout-shift',
        score: 9,
        value: 90,
      } satisfies AuditOutput),
    ).toThrow('too_big');
  });

  it('should throw for a missing score', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'total-blocking-time',
        value: 2500,
      }),
    ).toThrow('invalid_type');
  });

  it('should throw for an invalid slug', () => {
    expect(() =>
      auditOutputSchema.parse({
        slug: 'Lighthouse',
        value: 2500,
      }),
    ).toThrow('slug has to follow the pattern');
  });
});

describe('auditOutputsSchema', () => {
  it('should accept a valid audit output array', () => {
    expect(() =>
      auditOutputsSchema.parse([
        {
          slug: 'total-blocking-time',
          value: 2500,
          score: 0.8,
        },
        {
          slug: 'speed-index',
          score: 1,
          value: 250,
        },
      ] satisfies AuditOutputs),
    ).not.toThrow();
  });

  it('should accept an empty output array', () => {
    expect(() =>
      auditOutputsSchema.parse([] satisfies AuditOutputs),
    ).not.toThrow();
  });

  it('should throw for duplicate outputs', () => {
    expect(() =>
      auditOutputsSchema.parse([
        {
          slug: 'total-blocking-time',
          value: 2500,
          score: 0.8,
        },
        {
          slug: 'speed-index',
          score: 1,
          value: 250,
        },
        {
          slug: 'total-blocking-time',
          value: 4300,
          score: 0.75,
        },
      ] satisfies AuditOutputs),
    ).toThrow(
      String.raw`Audit slugs must be unique, but received duplicates: \"total-blocking-time\"`,
    );
  });
});
