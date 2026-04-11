import { Config, Context, Effect, Layer, Option, Redacted, Schema } from 'effect'

const ModelTemperature = Schema.NumberFromString.pipe(Schema.between(0, 2))
const SecretString = Schema.Redacted(Schema.NonEmptyString)

export interface ActionConfigData {
  readonly githubToken: Redacted.Redacted
  readonly openAIApiKey: Redacted.Redacted
  readonly modelName: string
  readonly modelTemperature: number
  readonly excludeFilePatterns: string[]
}

export class ActionConfig extends Context.Tag('@autoreviewer/ActionConfig')<ActionConfig, ActionConfigData>() {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const githubToken = yield* Schema.Config('GITHUB_TOKEN', SecretString)
      const openAIApiKey = yield* Schema.Config('OPENAI_API_KEY', SecretString)
      const modelName = yield* Config.option(Schema.Config('MODEL_NAME', Schema.NonEmptyString))
      const modelTemperature = yield* Config.option(Schema.Config('MODEL_TEMPERATURE', ModelTemperature))
      const excludeFiles = yield* Config.option(Config.string('EXCLUDE_FILES'))

      return ActionConfig.of({
        githubToken,
        openAIApiKey,
        modelName: Option.getOrElse(modelName, () => 'gpt-5.4'),
        modelTemperature: Option.getOrElse(modelTemperature, () => 0),
        excludeFilePatterns: Option.getOrElse(excludeFiles, () => '')
          .split(',')
          .map(pattern => pattern.trim())
          .filter(pattern => pattern.length > 0)
      })
    })
  )
}
