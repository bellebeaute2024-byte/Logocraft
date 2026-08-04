// Paddle price ID → credits mapping
export const PADDLE_PLANS = {
  // One-time credit packs
  [process.env.PADDLE_PRICE_STARTER!]: { credits: 10, type: 'one_time' as const, name: 'Starter Pack', price: 5 },
  [process.env.PADDLE_PRICE_PRO!]: { credits: 30, type: 'one_time' as const, name: 'Pro Pack', price: 12 },
  [process.env.PADDLE_PRICE_GROWTH!]: { credits: 75, type: 'one_time' as const, name: 'Growth Pack', price: 25 },
  // Subscriptions
  [process.env.PADDLE_PRICE_BASIC_MONTHLY!]: { credits: 50, type: 'subscription' as const, name: 'Basic Plan', price: 9, planType: 'basic' },
  [process.env.PADDLE_PRICE_UNLIMITED_MONTHLY!]: { credits: 999999, type: 'subscription' as const, name: 'Unlimited Plan', price: 29, planType: 'unlimited' },
}

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 5,
    credits: 10,
    type: 'one_time' as const,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || '',
    description: '10 logo generations',
    features: ['10 AI logo generations', '2 variations per generation', 'Full quality download', 'No expiry'],
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 12,
    credits: 30,
    type: 'one_time' as const,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || '',
    description: '30 logo generations',
    features: ['30 AI logo generations', '2 variations per generation', 'Full quality download', 'No expiry'],
    badge: 'Popular',
  },
  {
    id: 'growth',
    name: 'Growth Pack',
    price: 25,
    credits: 75,
    type: 'one_time' as const,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH || '',
    description: '75 logo generations',
    features: ['75 AI logo generations', '2 variations per generation', 'Full quality download', 'No expiry'],
    badge: 'Best Value',
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 9,
    credits: 50,
    type: 'subscription' as const,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_BASIC_MONTHLY || '',
    description: '50 logos/month',
    features: ['50 logo generations/month', '2 variations per generation', 'Full quality download', 'Auto-renewal monthly'],
    badge: null,
  },
  {
    id: 'unlimited',
    name: 'Unlimited Plan',
    price: 29,
    credits: -1,
    type: 'subscription' as const,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_UNLIMITED_MONTHLY || '',
    description: 'Unlimited logos/month',
    features: ['Unlimited logo generations', '2 variations per generation', 'Full quality download', 'Priority generation'],
    badge: 'Pro',
  },
]
