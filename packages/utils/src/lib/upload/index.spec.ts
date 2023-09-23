import { vi, Mock } from 'vitest';
import { GraphQLClient } from 'graphql-request';
import {
  Mutation,
  MutationSaveReportArgs,
  uploadToPortal,
  ReportFragmentDoc,
} from '@code-pushup/portal-client';
import gql from 'graphql-tag';

export const SaveReportDocument = gql`
  mutation saveReport(
    $organization: Slug!
    $project: Slug!
    $commit: CommitSHA!
    $plugins: [PluginReport!]!
    $categories: [CategoryConfig!]!
    $packageName: NpmPackageName
    $packageVersion: NpmPackageVersion
    $commandStartDate: Date
    $commandDuration: Int
  ) {
    saveReport(
      organization: $organization
      project: $project
      commit: $commit
      plugins: $plugins
      categories: $categories
      packageName: $packageName
      packageVersion: $packageVersion
      commandStartDate: $commandStartDate
      commandDuration: $commandDuration
    ) {
      ...Report
    }
  }
  ${ReportFragmentDoc}
`;

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
    } as Mutation);
    return {
      request: mockRequest,
    };
  }),
}));

describe('uploadToPortal', () => {
  test('should send GraphQL request', async () => {
    await expect(
      uploadToPortal({
        server: 'https://dunder-miflin.org/code-pushup/api/graphql',
        apiKey:
          'qm_e7117261a4d0e5ac890e488b54306bbfe9e782291eec6e3688ebdf506de917fb',
        data: {
          organization: 'dunder-miflin',
          project: 'website',
          commit: '4da737d63efcc83d0dd05620801f195968611eb7',
          plugins: [
            {
              slug: 'lighthouse',
              title: 'Lighthouse',
              icon: 'lighthouse',
              audits: [
                {
                  slug: 'largest-contentful-paint',
                  title: 'Largest Contentful Paint',
                  score: 0.81,
                  value: 1491,
                  formattedValue: '1.5 s',
                },
              ],
            },
          ],
        } as MutationSaveReportArgs,
      }),
    ).resolves.toEqual({
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
    });

    expect(GraphQLClient).toHaveBeenCalledWith(
      'https://dunder-miflin.org/code-pushup/api/graphql',
    );
    expect(mockRequest).toHaveBeenCalledWith(
      SaveReportDocument,
      {
        organization: 'dunder-miflin',
        project: 'website',
        commit: '4da737d63efcc83d0dd05620801f195968611eb7',
        plugins: [
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
            icon: 'lighthouse',
            audits: [
              {
                slug: 'largest-contentful-paint',
                title: 'Largest Contentful Paint',
                score: 0.81,
                value: 1491,
                formattedValue: '1.5 s',
              },
            ],
          },
        ],
      },
      {
        Authorization:
          'Bearer qm_e7117261a4d0e5ac890e488b54306bbfe9e782291eec6e3688ebdf506de917fb',
      },
    );
  });
});
