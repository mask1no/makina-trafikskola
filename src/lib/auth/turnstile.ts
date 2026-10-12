export function turnstileConfigured() {
  return Boolean(
    process.env.TURNSTILE_SITE_KEY?.trim() &&
      process.env.TURNSTILE_SECRET_KEY?.trim(),
  );
}

export function turnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY?.trim() || null;
}

/** Verify a Turnstile token. When keys are unset, skips and returns true. */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip: string,
): Promise<{ ok: boolean; skipped: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();
  if (!secret || !siteKey) {
    return { ok: true, skipped: true };
  }
  if (!token?.trim()) {
    return { ok: false, skipped: false };
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (ip && ip !== "unknown") {
    body.set("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  if (!response.ok) {
    return { ok: false, skipped: false };
  }
  const payload = (await response.json()) as { success?: boolean };
  return { ok: Boolean(payload.success), skipped: false };
}
