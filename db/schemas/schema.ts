import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

// Users table - synced from HappySeeds auth
export const users = pgTable('users', {
  id: text('id').primaryKey(), // HappySeeds user ID
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  credits: integer('credits').notNull().default(2), // 2 free credits on signup
  freeCreditsUsed: boolean('free_credits_used').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Subscriptions table - tracks active Paddle subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(), // Paddle subscription ID
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull(), // active, canceled, paused
  planType: text('plan_type').notNull(), // basic, unlimited
  paddlePriceId: text('paddle_price_id').notNull(),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Transactions table - tracks one-time credit purchases
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(), // Paddle transaction ID
  userId: text('user_id').notNull().references(() => users.id),
  paddlePriceId: text('paddle_price_id').notNull(),
  creditsAdded: integer('credits_added').notNull(),
  amountUsd: integer('amount_usd').notNull(), // in cents
  status: text('status').notNull(), // completed, failed
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Generation history
export const generations = pgTable('generations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  brandName: text('brand_name').notNull(),
  style: text('style'),
  creditsUsed: integer('credits_used').notNull().default(1),
  imageUrls: text('image_urls').array(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Generation = typeof generations.$inferSelect
