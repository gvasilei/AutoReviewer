import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods' with {
  'resolution-mode': 'import'
}
import { minimatch } from 'minimatch'
import * as core from '@actions/core'
import type { OctokitClient } from '../githubRuntime'
import { ArrElement } from '../typeUtils'
import { withResilience } from '../httpUtils'
import { Context, Effect, Layer, Schema } from 'effect'

export type PullRequestFileResponse = RestEndpointMethodTypes['pulls']['listFiles']['response']

export type PullRequestFile = ArrElement<PullRequestFileResponse['data']>
type CreateReviewCommentRequest = RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']

type CreateReviewRequest = RestEndpointMethodTypes['pulls']['createReview']['parameters']

export class GitHubApiError extends Schema.TaggedError<GitHubApiError>()('GitHubApiError', {
  operation: Schema.String,
  error: Schema.Defect
}) {}

const GITHUB_ATTEMPT_TIMEOUT = '10 seconds'
const GITHUB_TOTAL_TIMEOUT = '45 seconds'
const REVIEWABLE_FILE_STATUSES = ['modified', 'added', 'changed'] as const

const isReviewableStatus = (status: PullRequestFile['status']) =>
  REVIEWABLE_FILE_STATUSES.includes(status as (typeof REVIEWABLE_FILE_STATUSES)[number])

export class OctokitService extends Context.Tag('@autoreviewer/OctokitService')<OctokitService, OctokitClient>() {
  static readonly layer = (octokit: OctokitClient) => Layer.succeed(this, octokit)
}

export class PullRequestService extends Context.Tag('@autoreviewer/PullRequestService')<
  PullRequestService,
  {
    readonly getFilesForReview: (
      owner: string,
      repo: string,
      pullNumber: number,
      excludeFilePatterns: string[]
    ) => Effect.Effect<PullRequestFile[], GitHubApiError>
    readonly createReviewComment: (requestOptions: CreateReviewCommentRequest) => Effect.Effect<void, GitHubApiError>
    readonly createReview: (requestOptions: CreateReviewRequest) => Effect.Effect<void, GitHubApiError>
  }
>() {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const octokit = yield* OctokitService

      const callOctokit = <A>(operation: string, request: () => Promise<A>) =>
        Effect.tryPromise({
          try: request,
          catch: error =>
            GitHubApiError.make({
              operation,
              error
            })
        }).pipe(
          withResilience({
            operation: `PullRequestService.${operation}`,
            attemptTimeout: GITHUB_ATTEMPT_TIMEOUT,
            totalTimeout: GITHUB_TOTAL_TIMEOUT,
            onAttemptTimeout: () =>
              GitHubApiError.make({
                operation,
                error: new Error(`Timed out during ${operation}`)
              }),
            onTotalTimeout: () =>
              GitHubApiError.make({
                operation,
                error: new Error(`Exceeded overall timeout during ${operation}`)
              })
          })
        )

      const getFilesForReview = Effect.fn('PullRequestService.getFilesForReview')(function* (
        owner: string,
        repo: string,
        pullNumber: number,
        excludeFilePatterns: string[]
      ) {
        const pullRequestFiles = yield* callOctokit('pulls.listFiles', () =>
          octokit.rest.pulls.listFiles({ owner, repo, pull_number: pullNumber, per_page: 100 })
        )

        yield* Effect.sync(() => {
          core.info(
            `Original files for review ${pullRequestFiles.data.length}: ${pullRequestFiles.data.map(_ => _.filename)}`
          )
        })

        const fileReviewDecisions = yield* Effect.sync(() =>
          pullRequestFiles.data.map(file => {
            const matchedExcludePatterns = excludeFilePatterns.filter(pattern =>
              minimatch(file.filename, pattern, { matchBase: true })
            )
            const reviewableStatus = isReviewableStatus(file.status)
            const included = matchedExcludePatterns.length === 0 && reviewableStatus

            return {
              file,
              included,
              matchedExcludePatterns,
              reviewableStatus
            }
          })
        )

        yield* Effect.sync(() => {
          core.info(
            `Evaluating ${fileReviewDecisions.length} files against exclude patterns: ${
              excludeFilePatterns.length > 0 ? excludeFilePatterns.join(', ') : '<none>'
            }`
          )
          fileReviewDecisions.forEach(({ file, included, matchedExcludePatterns, reviewableStatus }) => {
            if (!reviewableStatus) {
              core.info(`Skipping ${file.filename}: unsupported file status "${file.status}"`)
              return
            }

            if (matchedExcludePatterns.length > 0) {
              core.info(`Skipping ${file.filename}: matched exclude pattern(s) ${matchedExcludePatterns.join(', ')}`)
              return
            }

            if (included) {
              core.info(`Including ${file.filename} for review`)
            }
          })
        })

        const filteredFiles = yield* Effect.sync(() =>
          fileReviewDecisions.filter(({ included }) => included).map(({ file }) => file)
        )

        yield* Effect.sync(() => {
          core.info(`Filtered files for review ${filteredFiles.length}: ${filteredFiles.map(_ => _.filename)}`)
        })

        return filteredFiles
      })

      const createReviewComment = Effect.fn('PullRequestService.createReviewComment')(function* (
        requestOptions: CreateReviewCommentRequest
      ) {
        yield* Effect.sync(() => {
          core.debug(`Creating review comment: ${JSON.stringify(requestOptions)}`)
        })

        yield* callOctokit('pulls.createReviewComment', () => octokit.rest.pulls.createReviewComment(requestOptions))
      })

      const createReview = Effect.fn('PullRequestService.createReview')(function* (
        requestOptions: CreateReviewRequest
      ) {
        yield* callOctokit('pulls.createReview', () => octokit.rest.pulls.createReview(requestOptions))
      })

      return PullRequestService.of({
        getFilesForReview,
        createReviewComment,
        createReview
      })
    })
  )
}
