import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, subscriptions, transactions } from '@/db/schemas/schema'
import { eq } from 'drizzle-orm'
import { addCredits, getUserByEmail } from '@/lib/user-service'
import { PADDLE_PLANS } from '@/lib/paddle-plans'

export const runtime = 'nodejs'

// Verify Paddle webhook signature
async function verifyPaddleWebhook(req: NextRequest): Promise<{ valid: boolean; body: string }> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) return { valid: false, body: '' }

  const body = await req.text()
  const signatureHeader = req.headers.get('paddle-signature')
  if (!signatureHeader) return { valid: false, body }

  // Parse ts and h1 from header
  const parts = Object.fromEntries(
    signatureHeader.split(';').map(p => p.split('=') as [string, string])
  )
  const ts = parts['ts']
  const h1 = parts['h1']
  if (!ts || !h1) return { valid: false, body }

  const payload = `${ts}:${body}`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const msgData = encoder.encode(payload)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('')

  return { valid: computed === h1, body }
}

export async function POST(req: NextRequest) {
  const { valid, body } = await verifyPaddleWebhook(req)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event_type as string
  const data = event.data as Record<string, unknown>

  try {
    if (eventType === 'transaction.completed') {
      await handleTransactionCompleted(data)
    } else if (eventType === 'subscription.activated') {
      await handleSubscriptionActivated(data)
    } else if (eventType === 'subscription.updated') {
      await handleSubscriptionUpdated(data)
    } else if (eventType === 'subscription.canceled') {
      await handleSubscriptionCanceled(data)
    }
  } catch (err) {
    console.error(`Paddle webhook error for ${eventType}:`, err)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function findUserFromCustomData(data: Record<string, unknown>): Promise<string | null> {
  const customData = data.custom_data as Record<string, string> | null
  const userId = customData?.user_id
  if (userId) return userId

  // Fall back to customer email
  const customer = data.customer as Record<string, unknown> | null
  const email = customer?.email as string | null
  if (email) {
    const user = await getUserByEmail(email)
    return user?.id ?? null
  }
  return null
}

async function handleTransactionCompleted(data: Record<string, unknown>) {
  const txId = data.id as string
  const userId = await findUserFromCustomData(data)
  if (!userId) return

  const items = data.items as Array<Record<string, unknown>>
  if (!items?.length) return

  const priceId = (items[0].price as Record<string, unknown>)?.id as string
  const plan = PADDLE_PLANS[priceId]
  if (!plan || plan.type !== 'one_time') return

  // Check not already processed
  const existing = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1)
  if (existing.length > 0) return

  const totals = data.details as Record<string, unknown>
  const grandTotal = (totals?.totals as Record<string, string>)?.grand_total ?? '0'

  await db.insert(transactions).values({
    id: txId,
    userId,
    paddlePriceId: priceId,
    creditsAdded: plan.credits,
    amountUsd: parseInt(grandTotal) || plan.price * 100,
    status: 'completed',
  })

  await addCredits(userId, plan.credits)
}

async function handleSubscriptionActivated(data: Record<string, unknown>) {
  const subId = data.id as string
  const userId = await findUserFromCustomData(data)
  if (!userId) return

  const items = data.items as Array<Record<string, unknown>>
  const priceId = (items?.[0]?.price as Record<string, unknown>)?.id as string
  const plan = PADDLE_PLANS[priceId]
  if (!plan || plan.type !== 'subscription') return

  const scheduledChange = data.scheduled_change as Record<string, unknown> | null
  const currentPeriodEnd = (data.current_billing_period as Record<string, string>)?.ends_at

  await db.insert(subscriptions).values({
    id: subId,
    userId,
    status: 'active',
    planType: plan.planType ?? 'basic',
    paddlePriceId: priceId,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
  }).onConflictDoUpdate({
    target: subscriptions.id,
    set: { status: 'active', updatedAt: new Date() },
  })

  // Add monthly credits for basic plan
  if (plan.planType === 'basic') {
    await addCredits(userId, plan.credits)
  }
  // Unlimited plan sets a special flag — handled by checking subscription status
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  const subId = data.id as string
  const status = data.status as string
  const currentPeriodEnd = (data.current_billing_period as Record<string, string>)?.ends_at

  await db.update(subscriptions)
    .set({
      status,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subId))
}

async function handleSubscriptionCanceled(data: Record<string, unknown>) {
  const subId = data.id as string
  await db.update(subscriptions)
    .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.id, subId))
}
