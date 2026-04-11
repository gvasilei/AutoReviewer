import { expect } from '@jest/globals'
import { Effect, Either } from 'effect'
import { withResilience } from '../src/httpUtils'

describe('withResilience', () => {
  it('fails with the attempt timeout error when an effect hangs', async () => {
    const result = await Effect.never.pipe(
      withResilience({
        operation: 'test-operation',
        attemptTimeout: '10 millis',
        totalTimeout: '50 millis',
        retries: 0,
        onAttemptTimeout: () => new Error('attempt timeout'),
        onTotalTimeout: () => new Error('total timeout')
      }),
      Effect.either,
      Effect.runPromise
    )

    expect(Either.isLeft(result)).toBe(true)

    if (Either.isRight(result)) {
      throw new Error('Expected hanging effect to time out')
    }

    expect(result.left).toBeInstanceOf(Error)
    expect(result.left.message).toBe('attempt timeout')
  })
})
