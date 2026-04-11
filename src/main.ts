import { config } from 'dotenv'
import * as core from '@actions/core'
import type { PullRequestEvent } from '@octokit/webhooks-types'

import * as OpenAiClient from '@effect/ai-openai/OpenAiClient'
import * as OpenAiLanguageModel from '@effect/ai-openai/OpenAiLanguageModel'
import * as NodeHttpClient from '@effect/platform-node/NodeHttpClient'
import type { OctokitClient } from './githubRuntime'
import { loadGitHubRuntime } from './githubRuntime'
import { CodeReviewService, CodeReviewServiceImpl } from './services/codeReviewService'
import { PullRequestService, PullRequestServiceImpl, octokitTag } from './services/pullRequestService'
import { LanguageDetectionService } from './services/languageDetectionService'

import { Effect, Exit, Layer, Match, Redacted, pipe } from 'effect'

config()

export const run = async (): Promise<void> => {
  const openAIApiKey = core.getInput('openai_api_key')
  const githubToken = core.getInput('github_token')
  const modelName = core.getInput('model_name')
  const temperature = Number(core.getInput('model_temperature'))
  const github = await loadGitHubRuntime()

  const context = github.context
  const { owner, repo } = context.repo

  const MainLive = initializeServices({
    octokit: github.getOctokit(githubToken),
    modelName,
    openAIApiKey,
    temperature
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
        Effect.map(() =>
          core
            .getInput('exclude_files')
            .split(',')
            .map(_ => _.trim())
        )
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
                  Effect.flatMap(codeReviewService => codeReviewService.codeReviewFor(file)),
                  Effect.flatMap(res =>
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
    core.setFailed(result.cause.toString())
  }
}

const initializeServices = ({
  octokit,
  modelName,
  openAIApiKey,
  temperature
}: {
  octokit: OctokitClient
  modelName: string
  openAIApiKey: string
  temperature: number
}) => {
  const CodeReviewServiceLive = Layer.succeed(
    CodeReviewService,
    CodeReviewService.of(new CodeReviewServiceImpl())
  )

  const octokitLive = Layer.succeed(octokitTag, octokit)

  const PullRequestServiceLive = Layer.succeed(
    PullRequestService,
    PullRequestService.of(new PullRequestServiceImpl())
  )

  const OpenAiClientLive = OpenAiClient.layer({
    apiKey: Redacted.make(openAIApiKey)
  }).pipe(Layer.provide(NodeHttpClient.layerUndici))

  const LanguageModelLive = OpenAiLanguageModel.model(modelName, {
    temperature
  }).pipe(Layer.provide(OpenAiClientLive))

  const mainLive = CodeReviewServiceLive.pipe(
    Layer.merge(PullRequestServiceLive),
    Layer.merge(LanguageDetectionService.Live),
    Layer.merge(octokitLive),
    Layer.merge(LanguageModelLive)
  )

  return mainLive
}

run()
