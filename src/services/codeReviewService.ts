import type * as AiError from '@effect/ai/AiError'
import * as LanguageModel from '@effect/ai/LanguageModel'
import * as Prompt from '@effect/ai/Prompt'
import { PullRequestFile } from './pullRequestService'
import parseDiff from 'parse-diff'
import { LanguageDetectionService, UnsupportedLanguageError } from './languageDetectionService'
import { withResilience } from '../httpUtils'
import { Context, Effect, Layer, Schema } from 'effect'

export interface CodeReviewResult {
  text: string
}

export class ReviewGenerationError extends Schema.TaggedError<ReviewGenerationError>()('ReviewGenerationError', {
  filename: Schema.String,
  error: Schema.Defect
}) {}

const REVIEW_ATTEMPT_TIMEOUT = '20 seconds'
const REVIEW_TOTAL_TIMEOUT = '90 seconds'

export class CodeReviewService extends Context.Tag('@autoreviewer/CodeReviewService')<
  CodeReviewService,
  {
    readonly codeReviewFor: (
      file: PullRequestFile
    ) => Effect.Effect<CodeReviewResult, UnsupportedLanguageError | ReviewGenerationError>
    readonly codeReviewForChunks: (
      file: PullRequestFile
    ) => Effect.Effect<CodeReviewResult[], UnsupportedLanguageError | ReviewGenerationError>
  }
>() {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const languageDetectionService = yield* LanguageDetectionService
      const languageModel = yield* LanguageModel.LanguageModel

      const generateReview = (filename: string, lang: string, diff: string) =>
        languageModel
          .generateText({
            prompt: makeReviewPrompt(lang, diff),
            toolChoice: 'none'
          })
          .pipe(
            withResilience({
              operation: 'CodeReviewService.generateReview',
              attemptTimeout: REVIEW_ATTEMPT_TIMEOUT,
              totalTimeout: REVIEW_TOTAL_TIMEOUT,
              onAttemptTimeout: () => new Error(`Timed out generating review for ${filename}`),
              onTotalTimeout: () => new Error(`Exceeded review generation timeout for ${filename}`)
            }),
            Effect.mapError((error: AiError.AiError | Error) =>
              ReviewGenerationError.make({
                filename,
                error
              })
            )
          )

      const codeReviewFor = Effect.fn('CodeReviewService.codeReviewFor')(function* (file: PullRequestFile) {
        const lang = yield* languageDetectionService.detectLanguage(file.filename)
        const response = yield* generateReview(file.filename, lang, file.patch ?? '')

        return { text: response.text }
      })

      const codeReviewForChunks = Effect.fn('CodeReviewService.codeReviewForChunks')(function* (file: PullRequestFile) {
        const lang = yield* languageDetectionService.detectLanguage(file.filename)
        const parsedDiff = yield* Effect.sync(() => parseDiff(file.patch ?? '')[0])

        return yield* Effect.forEach(parsedDiff?.chunks ?? [], chunk =>
          generateReview(file.filename, lang, chunk.content).pipe(Effect.map(response => ({ text: response.text })))
        )
      })

      return CodeReviewService.of({
        codeReviewFor,
        codeReviewForChunks
      })
    })
  )
}

const makeReviewPrompt = (lang: string, diff: string) => [
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
