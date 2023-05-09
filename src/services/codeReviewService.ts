/* eslint-disable filenames/match-regex */
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from 'langchain/prompts'
import { LLMChain } from 'langchain/chains'
import { BaseChatModel } from 'langchain/dist/chat_models/base'
import type { ChainValues } from 'langchain/dist/schema'
import { PullRequestFile } from './pullRequestService'

export class CodeReviewService {
  private llm: BaseChatModel
  private chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Act as an empathetic software engineer that's an expert in all programming languages, frameworks and software architecture."
    ),
    HumanMessagePromptTemplate.fromTemplate(`You will take in a git diff, and tell the user what they could have improved (like a code review)
    based on analyzing the git diff in order to see whats changed.
    The programming language in the snippet is {lang}.
    Feel free to provide any examples as markdown code snippets in your answer.

    {diff}`)
  ])
  private chain: LLMChain<string>

  constructor(llm: BaseChatModel) {
    this.llm = llm
    this.chain = new LLMChain({
      prompt: this.chatPrompt,
      llm: this.llm
    })
  }

  async codeReviewFor(file: PullRequestFile): Promise<ChainValues> {
    return await this.chain.call({
      lang: 'TypeScript',
      diff: file.patch
    })
  }
}
