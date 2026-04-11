import type * as AiError from '@effect/ai/AiError'
import * as LanguageModel from '@effect/ai/LanguageModel'
import * as Prompt from '@effect/ai/Prompt'
import { PullRequestFile } from './pullRequestService'
import parseDiff from 'parse-diff'
import { LanguageDetectionService } from './languageDetectionService'
import { exponentialBackoffWithJitter } from '../httpUtils'
import { Effect, Context } from 'effect'
import { NoSuchElementException } from 'effect/Cause'

export interface CodeReviewResult {
  text: string
}

export interface CodeReviewService {
  codeReviewFor(
    file: PullRequestFile
  ): Effect.Effect<
    CodeReviewResult,
    NoSuchElementException | AiError.AiError,
    LanguageDetectionService | LanguageModel.LanguageModel
  >
  codeReviewForChunks(
    file: PullRequestFile
  ): Effect.Effect<
    CodeReviewResult[],
    NoSuchElementException | AiError.AiError,
    LanguageDetectionService | LanguageModel.LanguageModel
  >
}

export const CodeReviewService = Context.GenericTag<CodeReviewService>('CodeReviewService')

export class CodeReviewServiceImpl {
  codeReviewFor = (
    file: PullRequestFile
  ): Effect.Effect<
    CodeReviewResult,
    NoSuchElementException | AiError.AiError,
    LanguageDetectionService | LanguageModel.LanguageModel
  > =>
    LanguageDetectionService.pipe(
      Effect.flatMap(languageDetectionService => languageDetectionService.detectLanguage(file.filename)),
      Effect.flatMap(lang =>
        Effect.retry(
          LanguageModel.generateText({
            prompt: this.makeReviewPrompt(lang, file.patch ?? ''),
            toolChoice: 'none'
          }),
          exponentialBackoffWithJitter(3)
        )
      ),
      Effect.map(response => ({ text: response.text }))
    )

  codeReviewForChunks(
    file: PullRequestFile
  ): Effect.Effect<
    CodeReviewResult[],
    NoSuchElementException | AiError.AiError,
    LanguageDetectionService | LanguageModel.LanguageModel
  > {
    const programmingLanguage = LanguageDetectionService.pipe(
      Effect.flatMap(languageDetectionService => languageDetectionService.detectLanguage(file.filename))
    )
    const fileDiff = Effect.sync(() => parseDiff(file.patch ?? '')[0])

    return Effect.all([programmingLanguage, fileDiff]).pipe(
      Effect.flatMap(([lang, fd]) =>
        Effect.all(
          (fd?.chunks ?? []).map(chunk =>
            Effect.retry(
              LanguageModel.generateText({
                prompt: this.makeReviewPrompt(lang, chunk.content),
                toolChoice: 'none'
              }),
              exponentialBackoffWithJitter(3)
            ).pipe(Effect.map(response => ({ text: response.text })))
          )
        )
      )
    )
  }

  private makeReviewPrompt = (lang: string, diff: string) => [
    Prompt.systemMessage({
      content:
        "Act as an empathetic software engineer that's an expert in all programming languages, frameworks and software architecture."
    }),
    Prompt.userMessage({
      content: [
        Prompt.textPart({
          text: `Your task is to review a Pull Request. You will receive a git diff.
Review it and suggest any improvements in code quality, maintainability, readability, performance, security, etc.
Identify any potential bugs or security vulnerabilities. Check it adheres to coding standards and best practices.
Suggest adding comments to the code only when you consider it a significant improvement.
Write your reply and examples in GitHub Markdown format. The programming language in the git diff is ${lang}.

git diff to review

${diff}`
        })
      ]
    })
  ]
}
