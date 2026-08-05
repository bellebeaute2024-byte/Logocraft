import 'server-only'
import { db } from '@/db'
import { users, subscriptions } from '@/db/schemas/schema'
import { eq } from 'drizzle-orm'
import type { User, Subscription } from '@/db/schemas/schema'

export async function getOrCreateUser(authUser: {
  id: string
  email: string
  name?: string
  avatar_url?: string
}): Promise<User> {
  const existing = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1)
  if (existing.length > 0) return existing[0]

  const [created] = await db.insert(users).values({
    id: authUser.id,
    email: authUser.email,
    name: authUser.name ?? null,
    avatarUrl: authUser.avatar_url ?? null,
    credits: 2,
    freeCreditsUsed: false,
  })
  .onConflictDoUpdate({
    target: users.id,
    set: {
      email: authUser.email,
      name: authUser.name ?? null,
      avatarUrl: authUser.avatar_url ?? null,
    },
  })
  .returning()
  return created
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result[0] ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0] ?? null
}

export async function deductCredit(userId: string): Promise<boolean> {
  const user = await getUserById(userId)
  if (!user || user.credits < 1) return false

  await db.update(users)
    .set({ credits: user.credits - 1 })
    .where(eq(users.id, userId))
  return true
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  const user = await getUserById(userId)
  if (!user) return
  await db.update(users)
    .set({ credits: user.credits + amount })
    .where(eq(users.id, userId))
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)
  const sub = result[0]
  if (!sub || sub.status !== 'active') return null
  return sub
}

export async function hasUnlimitedPlan(userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(userId)
  return sub?.planType === 'unlimited'
}
