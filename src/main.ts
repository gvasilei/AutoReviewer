import 'core-js/actual/structured-clone'
import { config } from 'dotenv'
import * as core from '@actions/core'
import * as github from '@actions/github'
import type { PullRequestEvent } from '@octokit/webhooks-definitions/schema'

import { ChatOpenAI } from 'langchain/chat_models/openai'
import { BaseChatModel } from 'langchain/dist/chat_models/base'
import {
  CodeReviewService,
  CodeReviewServiceImpl
} from './services/codeReviewService'
import {
  PullRequestService,
  PullRequestServiceImpl,
  PullRequestFile
} from './services/pullRequestService'
import {
  LanguageDetectionService,
  LanguageDetectionServiceImpl
} from './services/languageDetectionService'
import { GitHub } from '@actions/github/lib/utils'

import { Effect, Context, Layer, Match, pipe } from "effect"


config()

export const run = (): void => {
  const openAIApiKey = core.getInput('openai_api_key')
  const githubToken = core.getInput('github_token')
  const modelName = core.getInput('model_name')
  const temperature = parseInt(core.getInput('model_temperature'))

  const context = github.context
  const { owner, repo } = context.repo

  const model: BaseChatModel = new ChatOpenAI({
    temperature,
    openAIApiKey,
    modelName
  })

  const MainLive = initializeServices(model, githubToken)

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

     return pipe(
      excludeFilePatterns,
      Effect.flatMap(excludeFilePatterns =>     
        PullRequestService.pipe(
          Effect.flatMap(pullRequestService =>
            pullRequestService.getFilesForReview(
              owner,
              repo,
              context.payload.number,
              excludeFilePatterns
            )
          ),
          Effect.flatMap(files => 
            Effect.forEach(files, file => CodeReviewService.pipe(
              Effect.flatMap(codeReviewService =>
                codeReviewService.codeReviewFor(file)
              ),
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
                      position: file.patch?.split('\n').length ?? 1 - 1
                    })
                  )
                )
              )
            ))
          )
        )
      )
     )
    }),

        /*if (error instanceof Error) {
          core.error(error.stack || '')
          core.setFailed(error.message)
        }
  

      for (const file of files) {
        try {
          const res = await codeReviewService.codeReviewFor(file)
          const patch = file.patch || ''

          await pullRequestService.createReviewComment({
            repo,
            owner,
            pull_number: context.payload.number,
            commit_id: pullRequestPayload.pull_request.head.sha,
            path: file.filename,
            body: res.text,
            position: patch.split('\n').length - 1
          })
        } catch (error) {
          if (error instanceof Error) {
            core.error(
              `Failed creating review comment for ${file.filename}: ${error.message}`
            )
          }
        }
      }
      */

    Match.orElse(eventName => 
      Effect.sync(() => {
        core.setFailed(
          `This action only works on pull_request events. Got: ${eventName}`
        )
      })
    )
  )

  const runnable = Effect.provide(program, MainLive)

  Effect.runPromiseExit(runnable)
}

const initializeServices = (
  model: BaseChatModel,
  githubToken: string
) => {
  const LanguageDetectionServiceLive = Layer.succeed(
    LanguageDetectionService,
    LanguageDetectionService.of(new LanguageDetectionServiceImpl())
  )

  const CodeReviewServiceLive = Layer.effect(
    CodeReviewService,
    Effect.map(LanguageDetectionService, languageDetectionService =>
      CodeReviewService.of(
        new CodeReviewServiceImpl(model, languageDetectionService)
      )
    )
  )

  const octokitTag = Context.Tag<InstanceType<typeof GitHub>>()
  const octokitLive = Layer.succeed(octokitTag, github.getOctokit(githubToken))

  const PullRequestServiceLive = Layer.effect(
    PullRequestService,
    Effect.map(octokitTag, octokit =>
      PullRequestService.of(new PullRequestServiceImpl(octokit))
    )
  )

  const mainLive = Layer.merge(
    LanguageDetectionServiceLive.pipe(Layer.provide(CodeReviewServiceLive)),
    octokitLive.pipe(Layer.provide(PullRequestServiceLive))
  )

  return mainLive
}

run()
