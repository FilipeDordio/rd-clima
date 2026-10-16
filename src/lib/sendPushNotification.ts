import { supabase } from './supabase'

interface NotificationPayload {
  title: string
  body: string
  url?: string
}

export async function notifyUsers(userIds: string[], notification: NotificationPayload) {
  const targets = [...new Set(userIds)]
  if (targets.length === 0) return

  try {
    await supabase.functions.invoke('send-push', {
      body: { userIds: targets, notification },
    })
  } catch (error) {
    console.error('Falha ao enviar notificação push:', error)
  }
}
