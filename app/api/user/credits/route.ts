import { NextRequest, NextResponse } from "next/server";
import { handleHappySeedsMe } from "@/lib/happyseeds-platform-auth";
import { getOrCreateUser, hasUnlimitedPlan } from "@/lib/user-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const meResponse = await handleHappySeedsMe(req);
    if (meResponse.status !== 200) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const meData = await meResponse.json();
    const hsUser = meData.user;

    const user = await getOrCreateUser({
      id: hsUser.openid,
      email: hsUser.email ?? `${hsUser.openid}@noemail.local`,
      name: hsUser.display_name ?? undefined,
      avatar_url: hsUser.avatar_url ?? undefined,
    });

    const unlimited = await hasUnlimitedPlan(user.id);
    return NextResponse.json({ credits: unlimited ? -1 : user.credits });
  } catch {
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
