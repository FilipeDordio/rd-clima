import { createClient } from 'npm:@supabase/supabase-js@2.108.2'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:rdclima@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface RequestBody {
  userIds: string[]
  notification: { title: string; body: string; url?: string }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { userIds, notification } = (await req.json()) as RequestBody

  if (!userIds?.length || !notification?.title || !notification?.body) {
    return new Response(JSON.stringify({ error: 'Pedido inválido.' }), { status: 400 })
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const payload = JSON.stringify(notification)

  const results = await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        )
        return { id: sub.id, ok: true }
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { id: sub.id, ok: false }
      }
    }),
  )

  return new Response(JSON.stringify({ sent: results.filter((r) => r.ok).length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
