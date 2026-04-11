import { expect } from '@jest/globals'
import { ConfigProvider, Effect, Either, Redacted } from 'effect'
import { ActionConfig } from '../src/actionConfig'

const loadActionConfig = (entries: Array<[string, string]>) =>
  Effect.gen(function* () {
    return yield* ActionConfig
  }).pipe(Effect.provide(ActionConfig.layer), Effect.withConfigProvider(ConfigProvider.fromMap(new Map(entries))))

describe('ActionConfig', () => {
  it('parses inputs and trims exclude file patterns', async () => {
    const config = await loadActionConfig([
      ['GITHUB_TOKEN', 'github-token'],
      ['OPENAI_API_KEY', 'openai-key'],
      ['MODEL_NAME', 'gpt-5.4'],
      ['MODEL_TEMPERATURE', '0.7'],
      ['EXCLUDE_FILES', '  *.md, dist/** , , *.snap  ']
    ]).pipe(Effect.runPromise)

    expect(Redacted.value(config.githubToken)).toBe('github-token')
    expect(Redacted.value(config.openAIApiKey)).toBe('openai-key')
    expect(config.modelName).toBe('gpt-5.4')
    expect(config.modelTemperature).toBe(0.7)
    expect(config.excludeFilePatterns).toEqual(['*.md', 'dist/**', '*.snap'])
  })

  it('uses defaults for optional inputs', async () => {
    const config = await loadActionConfig([
      ['GITHUB_TOKEN', 'github-token'],
      ['OPENAI_API_KEY', 'openai-key']
    ]).pipe(Effect.runPromise)

    expect(config.modelName).toBe('gpt-5.4')
    expect(config.modelTemperature).toBe(0)
    expect(config.excludeFilePatterns).toEqual([])
  })

  it('fails validation for invalid temperature', async () => {
    const result = await loadActionConfig([
      ['GITHUB_TOKEN', 'github-token'],
      ['OPENAI_API_KEY', 'openai-key'],
      ['MODEL_TEMPERATURE', '3']
    ]).pipe(Effect.either, Effect.runPromise)

    expect(Either.isLeft(result)).toBe(true)

    if (Either.isLeft(result)) {
      expect(String(result.left)).toContain('MODEL_TEMPERATURE')
    }
  })
})
