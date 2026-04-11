import { Cause, ConfigError, Option } from 'effect'
import { ReviewGenerationError } from './services/codeReviewService'
import { UnsupportedLanguageError } from './services/languageDetectionService'
import { GitHubApiError } from './services/pullRequestService'

const formatPath = (path: ReadonlyArray<string>): string => (path.length > 0 ? path.join('.') : '<root>')

const formatUnknownError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return String(error)
}

const formatConfigError = (error: ConfigError.ConfigError): string =>
  ConfigError.reduceWithContext(error, undefined, {
    andCase: (_, left, right) => `${left}; ${right}`,
    orCase: (_, left, right) => `${left}; ${right}`,
    invalidDataCase: (_, path, message) => `${formatPath(path)}: ${message}`,
    missingDataCase: (_, path, message) => `${formatPath(path)}: ${message}`,
    sourceUnavailableCase: (_, path, message) => `${formatPath(path)}: ${message}`,
    unsupportedCase: (_, path, message) => `${formatPath(path)}: ${message}`
  })

export const formatFailureCause = (cause: Cause.Cause<unknown>): string =>
  Option.match(Cause.failureOption(cause), {
    onNone: () => Cause.pretty(cause, { renderErrorCause: true }),
    onSome: error => {
      if (ConfigError.isConfigError(error)) {
        return `Invalid action configuration: ${formatConfigError(error)}`
      }

      if (error instanceof UnsupportedLanguageError) {
        return `Unsupported language for file: ${error.filename}`
      }

      if (error instanceof ReviewGenerationError) {
        return `Failed to generate review for ${error.filename}: ${formatUnknownError(error.error)}`
      }

      if (error instanceof GitHubApiError) {
        return `GitHub API request failed during ${error.operation}: ${formatUnknownError(error.error)}`
      }

      return formatUnknownError(error)
    }
  })
