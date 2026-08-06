import { getChatGPTUser, type ChatGPTUser } from "../../app/chatgpt-auth";

export async function getApiUser(request: Request): Promise<ChatGPTUser | null> {
  const legacy = await getChatGPTUser();
  if (legacy) return legacy;
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { authorization: `Bearer ${token}`, apikey: key },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const user = await response.json() as { email?: string; user_metadata?: { full_name?: string; name?: string } };
  if (!user.email) return null;
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
  return { email: user.email, fullName, displayName: fullName || user.email };
}
