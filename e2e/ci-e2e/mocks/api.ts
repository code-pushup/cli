import type { Comment, ProviderAPIClient } from '@code-pushup/ci';

export const MOCK_COMMENT: Comment = {
  id: 42,
  body: '... <!-- generated by @code-pushup/ci -->',
  url: 'https://github.com/<owner>/<repo>/pull/1#issuecomment-42',
};

export const MOCK_API: ProviderAPIClient = {
  maxCommentChars: 1_000_000,
  createComment: () => Promise.resolve(MOCK_COMMENT),
  updateComment: () => Promise.resolve(MOCK_COMMENT),
  listComments: () => Promise.resolve([]),
};
