import { Schedule, Effect } from 'effect'

export const exponentialBackoffWithJitter = (retries = 3) =>
  Schedule.recurs(retries).pipe(Schedule.compose(Schedule.exponential(1000, 2)), Schedule.jittered)

const RETRIES = 3

export const retryWithBackoff = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.retry(effect, exponentialBackoffWithJitter(RETRIES))
