import 'core-js/actual/structured-clone'
import { config } from 'dotenv'
import * as core from '@actions/core'
import * as github from '@actions/github'
import type { PullRequestEvent } from '@octokit/webhooks-definitions/schema'

import { ChatOpenAI } from 'langchain/chat_models/openai'
import { BaseChatModel } from 'langchain/dist/chat_models/base'
import { CodeReviewService } from './services/codeReviewService'
import { PullRequestService } from './services/pullRequestService'

config()

export const run = async (): Promise<void> => {
  const openAIApiKey = process.env['OPENAI_API_KEY'] || ''
  const githubToken = core.getInput('github_token')
  const modelName = core.getInput('model_name')
  const temperature = parseInt(core.getInput('model_temperature'))

  const octokit = github.getOctokit(githubToken)
  const context = github.context
  const { owner, repo } = context.repo

  const model: BaseChatModel = new ChatOpenAI({
    temperature,
    openAIApiKey,
    modelName
  })

  const excludeFilePatterns = core
    .getInput('exclude_files')
    .split(',')
    .map(_ => _.trim())

  const codeReviewService = new CodeReviewService(model)
  const pullRequestService = new PullRequestService(octokit)

  if (github.context.eventName === 'pull_request') {
    const pullRequestPayload = github.context.payload as PullRequestEvent
    try {
      core.info(
        `repoName: ${repo} pull_number: ${context.payload.number} owner: ${owner} sha: ${pullRequestPayload.pull_request.head.sha}`
      )

      const files = await pullRequestService.getFilesForReview(
        owner,
        repo,
        context.payload.number,
        excludeFilePatterns
      )

      for (const file of files) {
        const res = await codeReviewService.codeReviewFor(file)
        const patch = file.patch || ''

        await pullRequestService.createReviewComment({
          repo,
          owner,
          pull_number: context.payload.number,
          commit_id: pullRequestPayload.pull_request.head.sha,
          path: file.filename,
          body: res.text,
          position: patch.split('\n').length - 1
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        core.error(error.stack || '')
        core.setFailed(error.message)
      }
    }
  } else {
    core.setFailed('This action only works on pull_request events')
  }
}

run()
