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
import parseDiff from 'parse-diff'
import { LanguageDetectionService } from './languageDetectionService'
export class CodeReviewService {
  private llm: BaseChatModel
  private chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Act as an empathetic software engineer that's an expert in all programming languages, frameworks and software architecture."
    ),
    HumanMessagePromptTemplate.fromTemplate(`You will take in a git diff, and tell the user what they could have improved (like a code review)
    based on analyzing the git diff in order to see whats changed.
    The programming language in the git diff is {lang}.
    Feel free to provide any examples as markdown code snippets in your answer.

    {diff}`)
  ])
  private chain: LLMChain<string>
  private languageDetectionService: LanguageDetectionService

  constructor(
    llm: BaseChatModel,
    languageDetectionService: LanguageDetectionService
  ) {
    this.llm = llm
    this.chain = new LLMChain({
      prompt: this.chatPrompt,
      llm: this.llm
    })
    this.languageDetectionService = languageDetectionService
  }

  async codeReviewFor(file: PullRequestFile): Promise<ChainValues> {
    const programmingLanguage = this.languageDetectionService.detectLanguage(
      file.filename
    )
    return await this.chain.call({
      lang: programmingLanguage,
      diff: file.patch
    })
  }

  async codeReviewForChunks(file: PullRequestFile): Promise<ChainValues> {
    const programmingLanguage = this.languageDetectionService.detectLanguage(
      file.filename
    )
    const fileDiff = parseDiff(file.patch)[0]
    const chunkReviews: ChainValues[] = []

    for (const chunk of fileDiff.chunks) {
      const chunkReview = await this.chain.call({
        lang: programmingLanguage,
        diff: chunk.content
      })

      chunkReviews.push(chunkReview)
    }

    return chunkReviews
  }
}
