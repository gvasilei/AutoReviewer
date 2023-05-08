import 'core-js/actual/structured-clone'
import { config } from 'dotenv'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from 'langchain/prompts'
import { LLMChain } from 'langchain/chains'
import { parseGitDiff, createGitDiff, excludeFilesByType, excludeDeletedFiles } from './gitParser'

config()

const run = async (): Promise<void> => {
  const openAIApiKey = process.env['OPENAI_API_KEY'] || ''
  const githubToken = core.getInput('github_token')
  const modelName = core.getInput('model_name')

  const octokit = github.getOctokit(githubToken)
  const context = github.context
  const repo = context.repo.repo
  const owner = context.repo.owner

  const model = new ChatOpenAI({
    temperature: 0,
    openAIApiKey,
    modelName
  })

  try {
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        "Act as an empathetic software engineer that's an expert in all programming languages, frameworks and software architecture."
      ),
      HumanMessagePromptTemplate.fromTemplate(`You will take in a git diff, and tell the user what they could have improved (like a code review)
      based on analyzing the git diff in order to see whats changed.
      The programming language in the snippet is {lang}.
      Feel free to provide any examples as markdown code snippets in your answer.

      {diff}`)
    ])

    const chain = new LLMChain({
      prompt: chatPrompt,
      llm: model
    })

    core.info(
      `repoName: ${repo} pull_number: ${context.payload.number} owner: ${owner}`
    )
    const pullRequest = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: context.payload.number
    })

    const { base, head, url, diff_url, patch_url, statuses_url } =
      pullRequest.data
    core.info(
      `${pullRequest.status} base: ${base} head: ${head} url: ${url} diff_url: ${diff_url} patch_url: ${patch_url} statuses_url: ${statuses_url}`
    )

    const diffRequest: { data: unknown } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: context.payload.number,
      mediaType: {
        format: 'diff'
      }
    })

    const gitDiff = parseGitDiff(diffRequest.data as string)
    const gitDiffExludeDeleted = excludeDeletedFiles(gitDiff)
    const excludedGitDiff = excludeFilesByType(gitDiffExludeDeleted, [
      'js',
      'json',
      'yml',
      'txt',
      'map',
      'gitignore'
    ])
    if (excludedGitDiff.length === 0) {
      core.info('No files to review')
      return
    }

    for (const file of excludedGitDiff) {
      const gitDiffString = createGitDiff([file])
      core.info(gitDiffString)

      const res = await chain.call({
        lang: 'TypeScript',
        diff: gitDiffString
      })

      core.info(JSON.stringify(res))

      await octokit.rest.pulls.createReviewComment({
        repo,
        owner,
        pull_number: context.payload.number,
        commit_id: pullRequest.data.head.sha,
        path: file.newPath.slice(1),
        body: res.text
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
