export type PortalPublication = {
  id: string;
  project_id: string;
  snapshot_json: string;
  pdf_object_key: string;
  active: number;
  expires_at: string | null;
};

export async function bindings() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as { DB: D1Database; MEDIA: R2Bucket };
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

export function active(publication: PortalPublication) {
  return (
    publication.active === 1 &&
    (!publication.expires_at || Date.parse(publication.expires_at) > Date.now())
  );
}
