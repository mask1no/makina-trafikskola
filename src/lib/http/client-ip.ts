/** Best-effort client IP behind Railway / reverse proxies. */
export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const trustedHop = hops.at(-1);
    if (trustedHop) return trustedHop;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
