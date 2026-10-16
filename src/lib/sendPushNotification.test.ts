import { afterEach, describe, expect, it, vi } from 'vitest'
import { notifyUsers } from './sendPushNotification'
import { supabase } from './supabase'

vi.mock('./supabase', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}))

const invoke = vi.mocked(supabase.functions.invoke)

afterEach(() => {
  invoke.mockReset()
})

describe('notifyUsers', () => {
  const payload = { title: 'Novo trabalho', body: 'Maria Silva — Ar Condicionado' }

  it('does nothing when there are no target users', async () => {
    await notifyUsers([], payload)

    expect(invoke).not.toHaveBeenCalled()
  })

  it('deduplicates repeated user ids before invoking the function', async () => {
    invoke.mockResolvedValue({ data: null, error: null })

    await notifyUsers(['tec-1', 'tec-1', 'tec-2'], payload)

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith('send-push', {
      body: { userIds: ['tec-1', 'tec-2'], notification: payload },
    })
  })

  it('swallows errors from the edge function instead of throwing', async () => {
    invoke.mockRejectedValue(new Error('network down'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(notifyUsers(['tec-1'], payload)).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
