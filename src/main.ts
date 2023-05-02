import { config } from 'dotenv'
import * as core from '@actions/core'
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
  const event_name = process.env['GITHUB_EVENT_NAME'] || ''
  const event_path = process.env['GITHUB_EVENT_PATH'] || ''
  const openAIApiKey = process.env['OPENAI_API_KEY'] || ''

  const model = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-4',
    openAIApiKey
  })

  try {
    core.info(
      `${repoPath} ${runId} ${event_name} ${event_path} ${openAIApiKey}`
    )

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

    core.info('set up chain')

    const res = await chain.call({
      input_language: 'English',
      output_language: 'French',
      text: 'I love programming.'
    })

    core.info('called chain')

    core.info(res.toString())

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
