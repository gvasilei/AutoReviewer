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

config()

const run = async (): Promise<void> => {
  const openAIApiKey = process.env['OPENAI_API_KEY'] || ''
  const githubToken = core.getInput('github_token')
  const modelName = core.getInput('model_name')

  const octokit = github.getOctokit(githubToken)
  const context = github.context
  const { owner, repo } = context.repo

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
      `repoName: ${repo} pull_number: ${context.payload.number} owner: ${owner} sha: ${context.sha}`
    )

    const pullRequestFiles = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: context.payload.number
    })

    const files = pullRequestFiles.data.filter(file => {
      return (
        file.filename.includes('.ts') &&
        file.status === ('modified' || 'added' || 'changed')
      )
    })

    core.info(JSON.stringify(files, null, 2))
    for (const file of files) {
      const res = await chain.call({
        lang: 'TypeScript',
        diff: file.patch
      })

      core.info(JSON.stringify(res))
      const patch = file.patch || ''

      await octokit.rest.pulls.createReviewComment({
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
