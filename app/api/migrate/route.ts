import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Simple secret check
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "logocraft-migrate-2024") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const results: string[] = [];

  try {
    // Add free_credits_used column if missing
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS free_credits_used boolean NOT NULL DEFAULT false`);
    results.push("✅ free_credits_used column OK");
  } catch (e) { results.push("free_credits_used: " + String(e)); }

  try {
    // Add credits column if missing
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 2`);
    results.push("✅ credits column OK");
  } catch (e) { results.push("credits: " + String(e)); }

  try {
    // Create users table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        email text NOT NULL UNIQUE,
        name text,
        avatar_url text,
        credits integer NOT NULL DEFAULT 2,
        free_credits_used boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    results.push("✅ users table OK");
  } catch (e) { results.push("users table: " + String(e)); }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES users(id),
        status text NOT NULL,
        plan_type text NOT NULL,
        paddle_price_id text NOT NULL,
        current_period_end timestamp,
        canceled_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    results.push("✅ subscriptions table OK");
  } catch (e) { results.push("subscriptions: " + String(e)); }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES users(id),
        paddle_price_id text NOT NULL,
        credits_added integer NOT NULL,
        amount_usd integer NOT NULL,
        status text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    results.push("✅ transactions table OK");
  } catch (e) { results.push("transactions: " + String(e)); }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS generations (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES users(id),
        brand_name text NOT NULL,
        style text,
        credits_used integer NOT NULL DEFAULT 1,
        image_urls text[],
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    results.push("✅ generations table OK");
  } catch (e) { results.push("generations: " + String(e)); }

  return NextResponse.json({ success: true, results });
}
