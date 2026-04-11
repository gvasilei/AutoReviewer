import { expect } from '@jest/globals'
import { Cause, ConfigError } from 'effect'
import { formatFailureCause } from '../src/failureFormatting'
import { ReviewGenerationError } from '../src/services/codeReviewService'
import { GitHubApiError } from '../src/services/pullRequestService'

describe('formatFailureCause', () => {
  it('formats config errors for GitHub Action output', () => {
    const message = formatFailureCause(Cause.fail(ConfigError.InvalidData(['MODEL_TEMPERATURE'], 'Expected 0..2')))

    expect(message).toBe('Invalid action configuration: MODEL_TEMPERATURE: Expected 0..2')
  })

  it('formats review generation errors with filename context', () => {
    const message = formatFailureCause(
      Cause.fail(
        ReviewGenerationError.make({
          filename: 'src/example.ts',
          error: new Error('model unavailable')
        })
      )
    )

    expect(message).toBe('Failed to generate review for src/example.ts: model unavailable')
  })

  it('formats GitHub API errors with operation context', () => {
    const message = formatFailureCause(
      Cause.fail(
        GitHubApiError.make({
          operation: 'pulls.listFiles',
          error: new Error('GitHub unavailable')
        })
      )
    )

    expect(message).toBe('GitHub API request failed during pulls.listFiles: GitHub unavailable')
  })
})
