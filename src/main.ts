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
import { parseGitDiff, createGitDiff, excludeFilesByType } from './gitParser'

config()

const run = async (): Promise<void> => {
  const openAIApiKey = process.env['OPENAI_API_KEY'] || ''
  const owner = process.env['GITHUB_REPOSITORY_OWNER'] || ''
  const githubToken = core.getInput('github_token')
  const modelName = core.getInput('MODEL_NAME')

  const model = new ChatOpenAI({
    temperature: 0,
    openAIApiKey,
    modelName
  })

  const octokit = github.getOctokit(githubToken)
  const context = github.context

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
      `repoName: ${context.payload.repository?.name || ''} pull_number: ${
        context.payload.number
      } owner: ${owner}`
    )
    const data2 = await octokit.rest.pulls.get({
      owner,
      repo: context.payload.repository?.name || '',
      pull_number: context.payload.number
    })

    const { base, head, url, diff_url, patch_url, statuses_url } = data2.data
    core.info(
      `${data2.status} base: ${base} head: ${head} url: ${url} diff_url: ${diff_url} patch_url: ${patch_url} statuses_url: ${statuses_url}`
    )

    const diffRequest: { data: unknown } = await octokit.rest.pulls.get({
      owner,
      repo: context.payload.repository?.name || '',
      pull_number: context.payload.number,
      mediaType: {
        format: 'diff'
      }
    })

    const gitDiff = parseGitDiff(diffRequest.data as string)
    const excludedGitDiff = excludeFilesByType(gitDiff, [
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
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.stack || '')
      core.setFailed(error.message)
    }
  }
}

run()
