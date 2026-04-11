import { expect, jest } from '@jest/globals'
import * as LanguageModel from '@effect/ai/LanguageModel'
import { Effect, Either, Layer } from 'effect'
import { CodeReviewService, ReviewGenerationError } from '../src/services/codeReviewService'
import { LanguageDetectionService, UnsupportedLanguageError } from '../src/services/languageDetectionService'
import type { PullRequestFile } from '../src/services/pullRequestService'

describe('CodeReviewService', () => {
  it('uses the language model prompt and maps the response text', async () => {
    const generateText = jest.fn(() => Effect.succeed({ text: 'Looks good overall.' } as any))

    const languageModelLive = Layer.succeed(
      LanguageModel.LanguageModel,
      {
        generateText: generateText as LanguageModel.Service['generateText'],
        generateObject: jest.fn() as LanguageModel.Service['generateObject'],
        streamText: jest.fn() as LanguageModel.Service['streamText']
      } satisfies LanguageModel.Service
    )

    const file = {
      filename: 'src/example.ts',
      patch: '@@ -1 +1 @@\n-const answer = 41\n+const answer = 42'
    } as PullRequestFile

    const result = await Effect.gen(function* () {
      const codeReviewService = yield* CodeReviewService
      return yield* codeReviewService.codeReviewFor(file)
    }).pipe(
      Effect.provide(CodeReviewService.layer),
      Effect.provide(LanguageDetectionService.Live),
      Effect.provide(languageModelLive),
      Effect.runPromise
    )

    expect(result).toEqual({ text: 'Looks good overall.' })
    expect(generateText).toHaveBeenCalledTimes(1)

    const options = (generateText.mock.calls as unknown as Array<[unknown]>)[0][0] as {
      prompt: Array<{ role: string; content: string | Array<{ text: string }> }>
      toolChoice: string
    }

    expect(options.toolChoice).toBe('none')
    expect(options.prompt[0]).toMatchObject({ role: 'system' })
    expect(options.prompt[1]).toMatchObject({ role: 'user' })
    expect((options.prompt[1]?.content as Array<{ text: string }>)[0]?.text).toContain(
      'The programming language in the git diff is typescript.'
    )
    expect((options.prompt[1]?.content as Array<{ text: string }>)[0]?.text).toContain(file.patch)
  })

  it('fails with UnsupportedLanguageError for unknown file extensions', async () => {
    const generateText = jest.fn(() => Effect.succeed({ text: 'Should not run' } as any))

    const languageModelLive = Layer.succeed(
      LanguageModel.LanguageModel,
      {
        generateText: generateText as LanguageModel.Service['generateText'],
        generateObject: jest.fn() as LanguageModel.Service['generateObject'],
        streamText: jest.fn() as LanguageModel.Service['streamText']
      } satisfies LanguageModel.Service
    )

    const file = {
      filename: 'src/example.unknown',
      patch: '@@ -1 +1 @@\n-old line\n+new line'
    } as PullRequestFile

    const result = await Effect.gen(function* () {
      const codeReviewService = yield* CodeReviewService
      return yield* codeReviewService.codeReviewFor(file)
    }).pipe(
      Effect.provide(CodeReviewService.layer),
      Effect.provide(LanguageDetectionService.Live),
      Effect.provide(languageModelLive),
      Effect.either,
      Effect.runPromise
    )

    expect(Either.isLeft(result)).toBe(true)

    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(UnsupportedLanguageError)
      expect(result.left.filename).toBe(file.filename)
    }

    expect(generateText).not.toHaveBeenCalled()
  })

  it(
    'maps language model failures to ReviewGenerationError',
    async () => {
    const generateText = jest.fn(() => Effect.fail(new Error('model unavailable') as any))

    const languageModelLive = Layer.succeed(
      LanguageModel.LanguageModel,
      {
        generateText: generateText as LanguageModel.Service['generateText'],
        generateObject: jest.fn() as LanguageModel.Service['generateObject'],
        streamText: jest.fn() as LanguageModel.Service['streamText']
      } satisfies LanguageModel.Service
    )

    const file = {
      filename: 'src/example.ts',
      patch: '@@ -1 +1 @@\n-old line\n+new line'
    } as PullRequestFile

    const result = await Effect.gen(function* () {
      const codeReviewService = yield* CodeReviewService
      return yield* codeReviewService.codeReviewFor(file)
    }).pipe(
      Effect.provide(CodeReviewService.layer),
      Effect.provide(LanguageDetectionService.Live),
      Effect.provide(languageModelLive),
      Effect.either,
      Effect.runPromise
    )

      expect(Either.isLeft(result)).toBe(true)

      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ReviewGenerationError)
        expect(result.left.filename).toBe(file.filename)
      }
    },
    15000
  )
})
