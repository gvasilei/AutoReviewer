import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { expect, jest } from '@jest/globals'

import { loadGitHubRuntime } from '../src/githubRuntime'

describe('loadGitHubRuntime', () => {
  let tempDirectory: string | undefined
  const originalEnv = {
    GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME,
    GITHUB_EVENT_PATH: process.env.GITHUB_EVENT_PATH,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY
  }
  const originalFetch = global.fetch

  afterEach(async () => {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true })
      tempDirectory = undefined
    }

    if (originalEnv.GITHUB_EVENT_NAME === undefined) {
      delete process.env.GITHUB_EVENT_NAME
    } else {
      process.env.GITHUB_EVENT_NAME = originalEnv.GITHUB_EVENT_NAME
    }

    if (originalEnv.GITHUB_EVENT_PATH === undefined) {
      delete process.env.GITHUB_EVENT_PATH
    } else {
      process.env.GITHUB_EVENT_PATH = originalEnv.GITHUB_EVENT_PATH
    }

    if (originalEnv.GITHUB_REPOSITORY === undefined) {
      delete process.env.GITHUB_REPOSITORY
    } else {
      process.env.GITHUB_REPOSITORY = originalEnv.GITHUB_REPOSITORY
    }

    global.fetch = originalFetch
  })

  it('loads GitHub Actions context and creates a REST client', async () => {
    tempDirectory = await mkdtemp(path.join(tmpdir(), 'autoreviewer-'))

    const eventPath = path.join(tempDirectory, 'event.json')

    await writeFile(
      eventPath,
      JSON.stringify({
        action: 'labeled',
        number: 141,
        pull_request: {
          head: {
            sha: 'ead984e91ad99a8d2a368b57eb8f22bbc2c225bf'
          }
        }
      })
    )

    process.env.GITHUB_EVENT_NAME = 'pull_request'
    process.env.GITHUB_EVENT_PATH = eventPath
    process.env.GITHUB_REPOSITORY = 'gvasilei/AutoReviewer'

    const github = await loadGitHubRuntime()

    expect(github.context.eventName).toBe('pull_request')
    expect(github.context.repo).toEqual({ owner: 'gvasilei', repo: 'AutoReviewer' })
    expect(github.context.payload.number).toBe(141)
    expect(github.context.payload.pull_request.head.sha).toBe('ead984e91ad99a8d2a368b57eb8f22bbc2c225bf')

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      url: 'https://api.github.com/repos/gvasilei/AutoReviewer/pulls/141/files?per_page=100',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [{ filename: 'src/main.ts', status: 'modified' }]
    } as Response)

    global.fetch = fetchMock as typeof fetch

    const octokit = github.getOctokit('test-token')
    const response = await octokit.rest.pulls.listFiles({
      owner: 'gvasilei',
      repo: 'AutoReviewer',
      pull_number: 141,
      per_page: 100
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/gvasilei/AutoReviewer/pulls/141/files?per_page=100',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer test-token',
          'User-Agent': 'AutoReviewer',
          'X-GitHub-Api-Version': '2022-11-28'
        })
      })
    )
    expect(response.data).toEqual([{ filename: 'src/main.ts', status: 'modified' }])
    expect(typeof octokit.rest.pulls.createReviewComment).toBe('function')
    expect(typeof octokit.rest.pulls.createReview).toBe('function')
  })
})
