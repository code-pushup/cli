import { Mock, vi } from 'vitest';

let mockRequest: Mock;

vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn(function () {
    mockRequest = vi.fn().mockResolvedValue({
      saveReport: {
        plugins: [
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
            icon: 'lighthouse',
          },
        ],
        audits: {
          edges: [
            {
              node: {
                slug: 'largest-contentful-paint',
                title: 'Largest Contentful Paint',
                score: 0.81,
                value: 1491,
                formattedValue: '1.5 s',
              },
            },
          ],
        },
      },
    });
    return {
      request: mockRequest,
    };
  }),
}));

describe('uploadToPortal', () => {
  test('should send GraphQL request', async () => {
    // @TODO
  });
});
