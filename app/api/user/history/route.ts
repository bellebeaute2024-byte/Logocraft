import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/google-auth";
import { db } from "@/db";
import { generations } from "@/db/schemas/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select()
      .from(generations)
      .where(eq(generations.userId, session.id))
      .orderBy(desc(generations.createdAt))
      .limit(20);

    return NextResponse.json({
      history: rows.map((r) => ({
        id: r.id,
        brandName: r.brandName,
        imageUrls: r.imageUrls ?? [],
        createdAt: r.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
