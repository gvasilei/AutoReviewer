import 'core-js/actual/structured-clone'
import { config } from 'dotenv'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { BaseChatModel } from 'langchain/dist/chat_models/base'
import { CodeReviewService } from './services/codeReviewService'
import { PullRequestService } from './services/pullRequestService'

config()

const run = async (): Promise<void> => {
  const openAIApiKey = process.env['OPENAI_API_KEY'] || ''
  const githubToken = core.getInput('github_token')
  const modelName = core.getInput('model_name')

  const octokit = github.getOctokit(githubToken)
  const context = github.context
  const { owner, repo } = context.repo

  const model: BaseChatModel = new ChatOpenAI({
    temperature: 0,
    openAIApiKey,
    modelName
  })

  const codeReviewService = new CodeReviewService(model)
  const pullRequestService = new PullRequestService(octokit)

  try {
    core.info(
      `repoName: ${repo} pull_number: ${context.payload.number} owner: ${owner} sha: ${context.sha}`
    )

    const files = await pullRequestService.getFilesForReview(
      owner,
      repo,
      context.payload.number
    )

    core.info(JSON.stringify(files, null, 2))
    for (const file of files) {
      const res = await codeReviewService.codeReviewFor(file)

      core.info(JSON.stringify(res))
      const patch = file.patch || ''

      await pullRequestService.createReviewComment({
        repo,
        owner,
        pull_number: context.payload.number,
        commit_id: context.sha,
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
}

run()
