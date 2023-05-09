// eslint-disable-next-line filenames/match-regex
import { GitHub } from '@actions/github/lib/utils'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'

export type PullRequestFileResponse =
  RestEndpointMethodTypes['pulls']['listFiles']['response']

type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
  ? ElementType
  : never

export type PullRequestFile = ArrElement<PullRequestFileResponse['data']>
type CreateReviewCommentRequest =
  RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']

export class PullRequestService {
  private octokit: InstanceType<typeof GitHub>

  constructor(octokit: InstanceType<typeof GitHub>) {
    this.octokit = octokit
  }

  getFilesForReview = async (
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<PullRequestFile[]> => {
    const pullRequestFiles = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    })

    return pullRequestFiles.data.filter(file => {
      return (
        file.filename.includes('.ts') &&
        file.status === ('modified' || 'added' || 'changed')
      )
    })
  }

  createReviewComment = async (
    requestOptions: CreateReviewCommentRequest
  ): Promise<void> => {
    await this.octokit.rest.pulls.createReviewComment(requestOptions)
  }
}
