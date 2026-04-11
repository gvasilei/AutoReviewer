import { expect, jest } from '@jest/globals'
import * as LanguageModel from '@effect/ai/LanguageModel'
import { Effect, Layer } from 'effect'
import { CodeReviewServiceImpl } from '../src/services/codeReviewService'
import { LanguageDetectionService } from '../src/services/languageDetectionService'
import type { PullRequestFile } from '../src/services/pullRequestService'

describe('CodeReviewServiceImpl', () => {
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

    const result = await new CodeReviewServiceImpl().codeReviewFor(file).pipe(
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
})
