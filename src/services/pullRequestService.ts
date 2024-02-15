// eslint-disable-next-line filenames/match-regex
import { GitHub } from '@actions/github/lib/utils'
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'
import { minimatch } from 'minimatch'
import * as core from '@actions/core'
import { ArrElement } from '../typeUtils'
import { Effect, Context, pipe } from 'effect'
import { UnknownException } from 'effect/Cause'

export type PullRequestFileResponse =
  RestEndpointMethodTypes['pulls']['listFiles']['response']

export type PullRequestFile = ArrElement<PullRequestFileResponse['data']>
type CreateReviewCommentRequest =
  RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']

type CreateReviewRequest =
  RestEndpointMethodTypes['pulls']['createReview']['parameters']

export interface PullRequestService {
  getFilesForReview: (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ) => Effect.Effect<
    PullRequestFile[],
    UnknownException,
    InstanceType<typeof GitHub>
  >
  createReviewComment: (
    requestOptions: CreateReviewCommentRequest
  ) => Effect.Effect<void, unknown, InstanceType<typeof GitHub>>
  createReview: (
    requestOptions: CreateReviewRequest
  ) => Effect.Effect<void, unknown, InstanceType<typeof GitHub>>
}

export const octokitTag =
  Context.GenericTag<InstanceType<typeof GitHub>>('octokit')

export const PullRequestService =
  Context.GenericTag<PullRequestService>('PullRequestService')
export class PullRequestServiceImpl {
  getFilesForReview = (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ): Effect.Effect<
    PullRequestFile[],
    UnknownException,
    InstanceType<typeof GitHub>
  > => {
    const program = octokitTag.pipe(
      Effect.flatMap(octokit =>
        Effect.tryPromise(() =>
          octokit.rest.pulls.listFiles({ owner, repo, pull_number: pullNumber })
        )
      ),
      Effect.tap(pullRequestFiles =>
        Effect.sync(() =>
          core.info(
            `Original files for review: ${pullRequestFiles.data.map(
              _ => _.filename
            )}`
          )
        )
      ),
      Effect.flatMap(pullRequestFiles =>
        Effect.sync(() =>
          pullRequestFiles.data.filter(file => {
            return (
              excludeFilePatterns.every(
                pattern =>
                  !minimatch(file.filename, pattern, { matchBase: true })
              ) &&
              (file.status === 'modified' ||
                file.status === 'added' ||
                file.status === 'changed')
            )
          })
        )
      ),
      Effect.tap(filteredFiles =>
        Effect.sync(() =>
          core.info(
            `Filtered files for review: ${filteredFiles.map(_ => _.filename)}`
          )
        )
      )
    )

    return program
  }

  createReviewComment = (
    requestOptions: CreateReviewCommentRequest
  ): Effect.Effect<void, Error, InstanceType<typeof GitHub>> => {
    return octokitTag.pipe(
      Effect.flatMap(octokit =>
        Effect.tryPromise(() =>
          octokit.rest.pulls.createReviewComment(requestOptions)
        )
      )
    )
  }

  createReview = (
    requestOptions: CreateReviewRequest
  ): Effect.Effect<void, Error, InstanceType<typeof GitHub>> => {
    return octokitTag.pipe(
      Effect.flatMap(octokit =>
        Effect.tryPromise(() => octokit.rest.pulls.createReview(requestOptions))
      )
    )
  }
}
