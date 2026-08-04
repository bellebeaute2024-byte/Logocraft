import { handleGoogleCallback } from "@/lib/google-auth";
import { getOrCreateUser } from "@/lib/user-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleGoogleCallback(request, async (user) => {
    await getOrCreateUser({
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      avatar_url: user.avatar_url ?? undefined,
    });
  });
}
