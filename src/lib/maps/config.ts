export function googleMapsBrowserConfig(
  environment: Record<string, string | undefined> = process.env,
) {
  return {
    apiKey:
      environment.GOOGLE_MAPS_BROWSER_KEY ??
      environment.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
    mapId:
      environment.GOOGLE_MAPS_MAP_ID ??
      environment.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
  };
}
