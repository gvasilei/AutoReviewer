import { config } from 'dotenv'
import * as core from '@actions/core'
import type { PullRequestEvent } from '@octokit/webhooks-types'

import * as OpenAiClient from '@effect/ai-openai/OpenAiClient'
import * as OpenAiLanguageModel from '@effect/ai-openai/OpenAiLanguageModel'
import * as NodeHttpClient from '@effect/platform-node/NodeHttpClient'
import { ActionConfig, type ActionConfigData } from './actionConfig'
import { formatFailureCause } from './failureFormatting'
import type { OctokitClient } from './githubRuntime'
import { loadGitHubRuntime } from './githubRuntime'
import { CodeReviewService } from './services/codeReviewService'
import { LanguageDetectionService, UnsupportedLanguageError } from './services/languageDetectionService'
import { OctokitService, PullRequestService } from './services/pullRequestService'

import { ConfigProvider, Effect, Exit, Layer, Match, Option, Redacted, pipe } from 'effect'

export const run = async (): Promise<void> => {
  const actionConfigResult = await Effect.sync(() => {
    config()
  }).pipe(
    Effect.flatMap(() => ActionConfig),
    Effect.provide(ActionConfig.layer),
    Effect.withConfigProvider(ConfigProvider.nested(ConfigProvider.fromEnv(), 'INPUT')),
    Effect.runPromiseExit
  )

  if (Exit.isFailure(actionConfigResult)) {
    core.setFailed(formatFailureCause(actionConfigResult.cause))
    return
  }

  const actionConfig = actionConfigResult.value

  const github = await loadGitHubRuntime()

  const context = github.context
  const { owner, repo } = context.repo

  const MainLive = initializeServices({
    actionConfig,
    octokit: github.getOctokit(Redacted.value(actionConfig.githubToken))
  })

  const program = Match.value(context.eventName).pipe(
    Match.when('pull_request', () => {
      const excludeFilePatterns = pipe(
        Effect.sync(() => github.context.payload as PullRequestEvent),
        Effect.tap(pullRequestPayload =>
          Effect.sync(() => {
            core.info(
              `repoName: ${repo} pull_number: ${context.payload.number} owner: ${owner} sha: ${pullRequestPayload.pull_request.head.sha}`
            )
          })
        ),
        Effect.flatMap(() => ActionConfig),
        Effect.map(config => [...config.excludeFilePatterns])
      )

      const a = excludeFilePatterns.pipe(
        Effect.flatMap(filePattens =>
          PullRequestService.pipe(
            Effect.flatMap(pullRequestService =>
              pullRequestService.getFilesForReview(owner, repo, context.payload.number, filePattens)
            ),
            Effect.flatMap(files => Effect.sync(() => files.filter(file => file.patch !== undefined))),
            Effect.flatMap(files =>
              Effect.forEach(files, file =>
                CodeReviewService.pipe(
                  Effect.flatMap(codeReviewService =>
                    codeReviewService.codeReviewFor(file).pipe(
                      Effect.map(Option.some),
                      Effect.catchTag('UnsupportedLanguageError', (error: UnsupportedLanguageError) =>
                        Effect.sync(() => {
                          core.info(`Skipping unsupported file for review: ${error.filename}`)
                        }).pipe(Effect.as(Option.none()))
                      )
                    )
                  ),
                  Effect.flatMap(reviewResult =>
                    Option.match(reviewResult, {
                      onNone: () => Effect.void,
                      onSome: res =>
                        PullRequestService.pipe(
                          Effect.flatMap(pullRequestService =>
                            pullRequestService.createReviewComment({
                              repo,
                              owner,
                              pull_number: context.payload.number,
                              commit_id: context.payload.pull_request?.head.sha,
                              path: file.filename,
                              body: res.text,
                              subject_type: 'file'
                            })
                          )
                        )
                    })
                  )
                )
              )
            )
          )
        )
      )

      return a
    }),

    Match.orElse(eventName =>
      Effect.sync(() => {
        core.setFailed(`This action only works on pull_request events. Got: ${eventName}`)
      })
    )
  )

  const runnable = Effect.provide(program, MainLive)
  const result = await Effect.runPromiseExit(runnable)

  if (Exit.isFailure(result)) {
    core.setFailed(formatFailureCause(result.cause))
  }
}

const initializeServices = ({ actionConfig, octokit }: { actionConfig: ActionConfigData; octokit: OctokitClient }) => {
  const octokitLive = OctokitService.layer(octokit)
  const actionConfigLive = Layer.succeed(ActionConfig, actionConfig)

  const OpenAiClientLive = OpenAiClient.layer({
    apiKey: actionConfig.openAIApiKey
  }).pipe(Layer.provide(NodeHttpClient.layerUndici))

  const LanguageModelLive = OpenAiLanguageModel.model(actionConfig.modelName, {
    temperature: actionConfig.modelTemperature
  }).pipe(Layer.provide(OpenAiClientLive))

  const CodeReviewServiceLive = CodeReviewService.layer.pipe(
    Layer.provideMerge(LanguageDetectionService.Live),
    Layer.provideMerge(LanguageModelLive)
  )

  const PullRequestServiceLive = PullRequestService.layer.pipe(Layer.provide(octokitLive))

  const mainLive = CodeReviewServiceLive.pipe(Layer.merge(PullRequestServiceLive), Layer.merge(actionConfigLive))

  return mainLive
}

run()
