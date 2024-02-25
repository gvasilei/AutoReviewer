import { Schedule } from 'effect'

export const exponentialBackoffWithJitter = (retries = 3) =>
  Schedule.recurs(retries).pipe(Schedule.compose(Schedule.exponential(1000, 2)), Schedule.jittered)