import { readFile } from 'node:fs/promises'

import type { PullRequestEvent } from '@octokit/webhooks-types'
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods' with {
  'resolution-mode': 'import'
}

type GitHubContext = {
  readonly eventName: string
  readonly payload: PullRequestEvent
  readonly repo: {
    readonly owner: string
    readonly repo: string
  }
}

type PullsApi = {
  readonly listFiles: (
    requestOptions: RestEndpointMethodTypes['pulls']['listFiles']['parameters']
  ) => Promise<RestEndpointMethodTypes['pulls']['listFiles']['response']>
  readonly createReviewComment: (
    requestOptions: RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']
  ) => Promise<RestEndpointMethodTypes['pulls']['createReviewComment']['response']>
  readonly createReview: (
    requestOptions: RestEndpointMethodTypes['pulls']['createReview']['parameters']
  ) => Promise<RestEndpointMethodTypes['pulls']['createReview']['response']>
}

export type OctokitClient = {
  readonly rest: {
    readonly pulls: PullsApi
  }
}

export type GitHubRuntime = {
  readonly context: GitHubContext
  readonly getOctokit: (token: string) => OctokitClient
}

const loadEventName = (): string => {
  const eventName = process.env.GITHUB_EVENT_NAME

  if (!eventName) {
    throw new Error('GITHUB_EVENT_NAME is not set')
  }

  return eventName
}

const loadRepository = (): GitHubContext['repo'] => {
  const repository = process.env.GITHUB_REPOSITORY

  if (!repository) {
    throw new Error('GITHUB_REPOSITORY is not set')
  }

  const [owner, repo, ...extraSegments] = repository.split('/')

  if (!owner || !repo || extraSegments.length > 0) {
    throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`)
  }

  return { owner, repo }
}

const loadPayload = async (): Promise<PullRequestEvent> => {
  const eventPath = process.env.GITHUB_EVENT_PATH

  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is not set')
  }

  const payload = await readFile(eventPath, 'utf8')

  return JSON.parse(payload) as PullRequestEvent
}

const GITHUB_API_BASE_URL = 'https://api.github.com'
const GITHUB_API_VERSION = '2022-11-28'

type RequestHeaders = Readonly<Record<string, string>>

const createHeaders = (token: string): RequestHeaders => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'User-Agent': 'AutoReviewer',
  'X-GitHub-Api-Version': GITHUB_API_VERSION
})

const buildApiUrl = (path: string, searchParams?: URLSearchParams): string => {
  const url = new URL(path, GITHUB_API_BASE_URL)

  if (searchParams) {
    url.search = searchParams.toString()
  }

  return url.toString()
}

const readErrorMessage = async (response: Response): Promise<string> => {
  const fallbackMessage = `${response.status} ${response.statusText}`.trim()

  try {
    const payload = (await response.json()) as { message?: string }
    return payload.message ? `${fallbackMessage}: ${payload.message}` : fallbackMessage
  } catch {
    return fallbackMessage
  }
}

const buildResponseHeaders = (headers: Headers): Record<string, string> => Object.fromEntries(headers.entries())

const requestGitHub = async <T>(
  token: string,
  url: string,
  init?: RequestInit
): Promise<{
  status: number
  headers: Record<string, string>
  url: string
  data: T
}> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...createHeaders(token),
      ...init?.headers
    }
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return {
    status: response.status,
    headers: buildResponseHeaders(response.headers),
    url: response.url,
    data: (await response.json()) as T
  }
}

const createOctokit = (token: string): OctokitClient => ({
  rest: {
    pulls: {
      listFiles: async requestOptions => {
        const searchParams = new URLSearchParams()

        if (requestOptions.per_page !== undefined) {
          searchParams.set('per_page', String(requestOptions.per_page))
        }

        const response = await requestGitHub<RestEndpointMethodTypes['pulls']['listFiles']['response']['data']>(
          token,
          buildApiUrl(
            `/repos/${requestOptions.owner}/${requestOptions.repo}/pulls/${requestOptions.pull_number}/files`,
            searchParams
          )
        )

        return response as RestEndpointMethodTypes['pulls']['listFiles']['response']
      },
      createReviewComment: async requestOptions => {
        const { owner, repo, pull_number, ...body } = requestOptions
        const response = await requestGitHub<
          RestEndpointMethodTypes['pulls']['createReviewComment']['response']['data']
        >(token, buildApiUrl(`/repos/${owner}/${repo}/pulls/${pull_number}/comments`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        return response as unknown as RestEndpointMethodTypes['pulls']['createReviewComment']['response']
      },
      createReview: async requestOptions => {
        const { owner, repo, pull_number, ...body } = requestOptions
        const response = await requestGitHub<RestEndpointMethodTypes['pulls']['createReview']['response']['data']>(
          token,
          buildApiUrl(`/repos/${owner}/${repo}/pulls/${pull_number}/reviews`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          }
        )

        return response as unknown as RestEndpointMethodTypes['pulls']['createReview']['response']
      }
    }
  }
})

export const loadGitHubRuntime = async (): Promise<GitHubRuntime> => ({
  context: {
    eventName: loadEventName(),
    payload: await loadPayload(),
    repo: loadRepository()
  },
  getOctokit: createOctokit
})
