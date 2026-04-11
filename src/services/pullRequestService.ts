import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods' with { "resolution-mode": "import" }
import { minimatch } from 'minimatch'
import * as core from '@actions/core'
import type { OctokitClient } from '../githubRuntime'
import { ArrElement } from '../typeUtils'
import { exponentialBackoffWithJitter } from '../httpUtils'
import { Effect, Context } from 'effect'
import { UnknownException } from 'effect/Cause'

export type PullRequestFileResponse = RestEndpointMethodTypes['pulls']['listFiles']['response']

export type PullRequestFile = ArrElement<PullRequestFileResponse['data']>
type CreateReviewCommentRequest = RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']

type CreateReviewRequest = RestEndpointMethodTypes['pulls']['createReview']['parameters']

export interface PullRequestService {
  getFilesForReview: (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ) => Effect.Effect<PullRequestFile[], UnknownException, OctokitClient>
  createReviewComment: (
    requestOptions: CreateReviewCommentRequest
  ) => Effect.Effect<void, unknown, OctokitClient>
  createReview: (requestOptions: CreateReviewRequest) => Effect.Effect<void, unknown, OctokitClient>
}

export const octokitTag = Context.GenericTag<OctokitClient>('octokit')

export const PullRequestService = Context.GenericTag<PullRequestService>('PullRequestService')
export class PullRequestServiceImpl {
  getFilesForReview = (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ): Effect.Effect<PullRequestFile[], UnknownException, OctokitClient> => {
    const program = octokitTag.pipe(
      Effect.flatMap(octokit =>
        Effect.retry(
          Effect.tryPromise(() =>
            octokit.rest.pulls.listFiles({ owner, repo, pull_number: pullNumber, per_page: 100 })
          ),
          exponentialBackoffWithJitter(3)
        )
      ),
      Effect.tap(pullRequestFiles =>
        Effect.sync(() =>
          core.info(
            `Original files for review ${pullRequestFiles.data.length}: ${pullRequestFiles.data.map(_ => _.filename)}`
          )
        )
      ),
      Effect.flatMap(pullRequestFiles =>
        Effect.sync(() =>
          pullRequestFiles.data.filter(file => {
            return (
              excludeFilePatterns.every(pattern => !minimatch(file.filename, pattern, { matchBase: true })) &&
              (file.status === 'modified' || file.status === 'added' || file.status === 'changed')
            )
          })
        )
      ),
      Effect.tap(filteredFiles =>
        Effect.sync(() =>
          core.info(`Filtered files for review ${filteredFiles.length}: ${filteredFiles.map(_ => _.filename)}`)
        )
      )
    )

    return program
  }

  createReviewComment = (
    requestOptions: CreateReviewCommentRequest
  ): Effect.Effect<void, Error, OctokitClient> =>
    octokitTag.pipe(
      Effect.tap(() => core.debug(`Creating review comment: ${JSON.stringify(requestOptions)}`)),
      Effect.flatMap(octokit =>
        Effect.retry(
          Effect.tryPromise(() => octokit.rest.pulls.createReviewComment(requestOptions)),
          exponentialBackoffWithJitter(3)
        )
      )
    )

  createReview = (requestOptions: CreateReviewRequest): Effect.Effect<void, Error, OctokitClient> =>
    octokitTag.pipe(
      Effect.flatMap(octokit =>
        Effect.retry(
          Effect.tryPromise(() => octokit.rest.pulls.createReview(requestOptions)),
          exponentialBackoffWithJitter(3)
        )
      )
    )
}
