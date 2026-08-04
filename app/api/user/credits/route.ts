import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/google-auth";
import { getOrCreateUser, hasUnlimitedPlan } from "@/lib/user-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSession(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser({
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name ?? undefined,
      avatar_url: sessionUser.avatar_url ?? undefined,
    });

    const unlimited = await hasUnlimitedPlan(user.id);
    return NextResponse.json({ credits: unlimited ? -1 : user.credits });
  } catch {
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
