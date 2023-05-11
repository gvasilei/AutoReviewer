// eslint-disable-next-line filenames/match-regex
import { GitHub } from '@actions/github/lib/utils'
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'
import { minimatch } from 'minimatch'
import * as core from '@actions/core'

export type PullRequestFileResponse =
  RestEndpointMethodTypes['pulls']['listFiles']['response']

type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
  ? ElementType
  : never

export type PullRequestFile = ArrElement<PullRequestFileResponse['data']>
type CreateReviewCommentRequest =
  RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']

type CreateReviewRequest =
  RestEndpointMethodTypes['pulls']['createReview']['parameters']

export class PullRequestService {
  private octokit: InstanceType<typeof GitHub>

  constructor(octokit: InstanceType<typeof GitHub>) {
    this.octokit = octokit
  }

  getFilesForReview = async (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ): Promise<PullRequestFile[]> => {
    const pullRequestFiles = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    })

    core.info(
      `Original files for review: ${pullRequestFiles.data.map(_ => _.filename)}`
    )

    const filteredFiles = pullRequestFiles.data.filter(file => {
      return (
        excludeFilePatterns.every(
          pattern => !minimatch(file.filename, pattern, { matchBase: true })
        ) &&
        (file.status === 'modified' ||
          file.status === 'added' ||
          file.status === 'changed')
      )
    })

    core.info(`Files for review: ${filteredFiles.map(_ => _.filename)}`)
    return filteredFiles
  }

  createReviewComment = async (
    requestOptions: CreateReviewCommentRequest
  ): Promise<void> => {
    await this.octokit.rest.pulls.createReviewComment(requestOptions)
  }

  createReview = async (requestOptions: CreateReviewRequest): Promise<void> => {
    await this.octokit.rest.pulls.createReview(requestOptions)
  }
}
