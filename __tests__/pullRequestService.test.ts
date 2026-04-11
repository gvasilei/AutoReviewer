import { expect, jest } from '@jest/globals'
import { Effect, Either } from 'effect'
import type { OctokitClient } from '../src/githubRuntime'
import { GitHubApiError, OctokitService, PullRequestService } from '../src/services/pullRequestService'

jest.mock('@actions/core', () => ({
  info: jest.fn(),
  debug: jest.fn()
}))

describe('PullRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return files for review only with specific status', async () => {
    const listFiles = jest.fn().mockResolvedValue({
      data: [
        { filename: 'foo.ts', status: 'modified' },
        { filename: 'bar.ts', status: 'removed' },
        { filename: 'baz.ts', status: 'changed' }
      ]
    })

    const octokit = {
      rest: {
        pulls: {
          listFiles,
          createReviewComment: jest.fn(),
          createReview: jest.fn()
        }
      }
    } as unknown as OctokitClient

    const files = await Effect.gen(function* () {
      const pullRequestService = yield* PullRequestService
      return yield* pullRequestService.getFilesForReview('test-owner', 'test-repo', 1, [])
    }).pipe(Effect.provide(PullRequestService.layer), Effect.provide(OctokitService.layer(octokit)), Effect.runPromise)

    expect(listFiles).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      pull_number: 1,
      per_page: 100
    })
    expect(files).toEqual([
      { filename: 'foo.ts', status: 'modified' },
      { filename: 'baz.ts', status: 'changed' }
    ])
  })

  it('should filter files according to excludeFilePatterns', async () => {
    const listFiles = jest.fn().mockResolvedValue({
      data: [
        { filename: 'foo.ts', status: 'modified' },
        { filename: 'dist/index.js', status: 'added' },
        { filename: 'baz.md', status: 'changed' },
        { filename: 'dist/index.js.map', status: 'added' }
      ]
    })

    const octokit = {
      rest: {
        pulls: {
          listFiles,
          createReviewComment: jest.fn(),
          createReview: jest.fn()
        }
      }
    } as unknown as OctokitClient

    const files = await Effect.gen(function* () {
      const pullRequestService = yield* PullRequestService
      return yield* pullRequestService.getFilesForReview('test-owner', 'test-repo', 1, ['*.ts', '*.js', '*.js.map'])
    }).pipe(Effect.provide(PullRequestService.layer), Effect.provide(OctokitService.layer(octokit)), Effect.runPromise)

    expect(files).toEqual([{ filename: 'baz.md', status: 'changed' }])
  })

  it('maps octokit failures to GitHubApiError', async () => {
    const listFiles = jest.fn().mockRejectedValue(new Error('GitHub unavailable'))

    const octokit = {
      rest: {
        pulls: {
          listFiles,
          createReviewComment: jest.fn(),
          createReview: jest.fn()
        }
      }
    } as unknown as OctokitClient

    const result = await Effect.gen(function* () {
      const pullRequestService = yield* PullRequestService
      return yield* pullRequestService.getFilesForReview('test-owner', 'test-repo', 1, [])
    }).pipe(
      Effect.provide(PullRequestService.layer),
      Effect.provide(OctokitService.layer(octokit)),
      Effect.either,
      Effect.runPromise
    )

    expect(Either.isLeft(result)).toBe(true)

    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(GitHubApiError)
      expect(result.left.operation).toBe('pulls.listFiles')
    }

    expect(listFiles).toHaveBeenCalledTimes(4)
  }, 15000)
})
