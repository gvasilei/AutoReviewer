// eslint-disable-next-line filenames/match-regex
import { GitHub } from '@actions/github/lib/utils'
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'
import { minimatch } from 'minimatch'
import * as core from '@actions/core'
import { ArrElement } from '../typeUtils'
import { Effect, Context, pipe } from "effect"

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
  ) => Effect.Effect<InstanceType<typeof GitHub>, unknown, PullRequestFile[]>
  createReviewComment: (
    requestOptions: CreateReviewCommentRequest
  ) => Effect.Effect<InstanceType<typeof GitHub>, unknown, void>
  createReview: (
    requestOptions: CreateReviewRequest
  ) => Effect.Effect<InstanceType<typeof GitHub>, unknown, void>
}

export const PullRequestService = Context.Tag<PullRequestService>()
export class PullRequestServiceImpl {
  private octokit: InstanceType<typeof GitHub>

  constructor(octokit: InstanceType<typeof GitHub>) {
    this.octokit = octokit
  }

  getFilesForReview = (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ): Effect.Effect<InstanceType<typeof GitHub>, unknown, PullRequestFile[]> => {
    // TODO - Check program return type
    const program = pipe(
      Effect.tryPromise(() =>
        this.octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: pullNumber
        })
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
              excludeFilePatterns.every(pattern => {
                core.debug(
                  `pattern: ${pattern} file: ${file.filename} ${!minimatch(
                    file.filename,
                    pattern,
                    { matchBase: true }
                  )}`
                )
                return !minimatch(file.filename, pattern, { matchBase: true })
              }) &&
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
  ): Effect.Effect<InstanceType<typeof GitHub>, Error, void> => {
    return Effect.promise(() =>
      this.octokit.rest.pulls.createReviewComment(requestOptions)
    )
  }

  createReview = (
    requestOptions: CreateReviewRequest
  ): Effect.Effect<InstanceType<typeof GitHub>, Error, void> => {
    return Effect.promise(() =>
      this.octokit.rest.pulls.createReview(requestOptions)
    )
  }
}
