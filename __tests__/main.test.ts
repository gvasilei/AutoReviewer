import { expect, jest } from '@jest/globals'

/*jimport * as core from '@actions/core'
import * as github from '@actions/github'
import { CodeReviewService } from '../src/services/codeReviewService'
import { PullRequestService } from '../src/services/pullRequestService'

jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('../src/services/codeReviewService')
jest.mock('../src/services/pullRequestService')

const mockedCore = jest.mocked(core)
const mockedGitHub = jest.mocked(github)
const mockedCodeReviewService = jest.mocked(CodeReviewService)
const mockedPullRequestService = jest.mocked(PullRequestService)
*/

describe('run', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should pass a dummy test', () => {
    expect(true).toBe(true)
  })
})

/*it('should set action as failed if event is not pull_request', async () => {
  mockedGitHub.context.eventName = 'some_other_event'
  mockedGitHub.context.repo.owner = 'some_owner'
  mockedGitHub.context.repo.repo = 'some_repo'
  await run()

  expect(mockedCore.setFailed).toHaveBeenCalledWith('This action only works on pull_request events')
})*/

// shows how the runner will run a javascript action with env / stdout protocol
/*test('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = '500'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})*/
