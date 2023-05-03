import 'core-js/actual/structured-clone'
import { config } from 'dotenv'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { wait } from './wait'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from 'langchain/prompts'
import { LLMChain } from 'langchain/chains'

config()

const run = async (): Promise<void> => {
  const repoPath = process.env['GITHUB_WORKSPACE'] || ''
  const runId = process.env['GITHUB_RUN_ID'] || ''
  const eventName = process.env['GITHUB_EVENT_NAME'] || ''
  const eventPath = process.env['GITHUB_EVENT_PATH'] || ''
  const openAIApiKey = process.env['OPENAI_API_KEY'] || ''
  const owner = process.env['GITHUB_REPOSITORY_OWNER'] || ''
  const headRef = process.env['GITHUB_HEAD_REF'] || ''
  const baseRef = process.env['GITHUB_BASE_REF'] || ''
  const repoName = process.env['GITHUB_REPOSITORY'] || ''
  const githubToken = core.getInput('github_token')

  const model = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-4',
    openAIApiKey
  })

  const octokit = github.getOctokit(githubToken)

  try {
    core.info(`${owner} ${runId} ${repoName} ${headRef} ${baseRef}`)
    /*const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo: 'rest.js',
      pull_number: 123,
      mediaType: {
        format: 'diff'
      }
    })*/

    // We can also construct an LLMChain from a ChatPromptTemplate and a chat model.
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'You are a helpful assistant that translates {input_language} to {output_language}.'
      ),
      HumanMessagePromptTemplate.fromTemplate('{text}')
    ])

    core.info('set up chat prompt')
    const chain = new LLMChain({
      prompt: chatPrompt,
      llm: model
    })

    const res = await chain.call({
      input_language: 'English',
      output_language: 'French',
      text: 'I love programming.'
    })

    for (const key in res) {
      core.info(`${key} - ${res[key]}`)
    }

    const data = await octokit.rest.repos.compareCommitsWithBasehead({
      basehead: `${baseRef}...${headRef}`,
      owner,
      repo: 'AutoReviewer',
      mediaType: {
        format: 'diff'
      }
    })
    data.data.files?.map(file => {
      core.info(`${file.filename} ${file.status}`)
    })

    const ms: string = core.getInput('milliseconds')
    core.info(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true
    core.info(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.info(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.stack || '')
      core.setFailed(error.message)
    }
  }
}

run()
