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
    HumanMessagePromptTemplate.fromTemplate(`Your task is to review a Pull Request. You will receive a git diff. 
    Review it and suggest any improvements in code quality, maintainability, readability, performance, security, etc.
    Identify any potential bugs or security vulnerabilities. Check it adheres to coding standards and best practices.
    Suggest adding comments to the code only when you consider it a significant improvement.
    Write your reply and examples in GitHub Markdown format. The programming language in the git diff is {lang}.

    git diff to review

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
