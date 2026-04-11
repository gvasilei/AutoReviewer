import { Duration, Effect, Schedule } from 'effect'

export const exponentialBackoffWithJitter = (retries = 3) =>
  Schedule.recurs(retries).pipe(Schedule.compose(Schedule.exponential(1000, 2)), Schedule.jittered)

const RETRIES = 3

export const retryWithBackoff = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.retry(effect, exponentialBackoffWithJitter(RETRIES))

export const withResilience =
  <E2>({
    operation,
    attemptTimeout,
    totalTimeout,
    retries = RETRIES,
    onAttemptTimeout,
    onTotalTimeout
  }: {
    operation: string
    attemptTimeout: Duration.DurationInput
    totalTimeout: Duration.DurationInput
    retries?: number
    onAttemptTimeout: () => E2
    onTotalTimeout: () => E2
  }) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | E2, R> =>
    effect.pipe(
      Effect.annotateLogs({
        operation,
        attemptTimeout,
        totalTimeout,
        retries
      }),
      Effect.withSpan(operation),
      Effect.timeoutFail({
        duration: attemptTimeout,
        onTimeout: onAttemptTimeout
      }),
      Effect.retry(exponentialBackoffWithJitter(retries)),
      Effect.timeoutFail({
        duration: totalTimeout,
        onTimeout: onTotalTimeout
      })
    )
