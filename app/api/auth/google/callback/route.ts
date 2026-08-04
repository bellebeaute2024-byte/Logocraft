import { handleHappySeedsCallback } from "../../../../../lib/happyseeds-platform-auth";
import { getOrCreateUser } from "@/lib/user-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleHappySeedsCallback(request, async (hsUser) => {
    await getOrCreateUser({
      id: hsUser.openid,
      email: hsUser.email ?? `${hsUser.openid}@noemail.local`,
      name: hsUser.display_name ?? undefined,
      avatar_url: hsUser.avatar_url ?? undefined,
    });
  });
}
