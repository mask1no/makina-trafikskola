const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Makina+Trafikskola+Centralv%C3%A4gen+5+Upplands+V%C3%A4sby";

export type GoogleSchoolReviews = {
  url: string;
  rating: number | null;
  count: number | null;
};

type PlaceResult = {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
};

export async function googleSchoolReviews(): Promise<GoogleSchoolReviews> {
  const fallback: GoogleSchoolReviews = { url: MAPS_URL, rating: null, count: null };
  const key = process.env.GOOGLE_MAPS_SERVER_KEY?.trim();
  if (!key) return fallback;
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
        "x-goog-fieldmask":
          "places.displayName,places.rating,places.userRatingCount,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: "Makina Trafikskola Centralvägen 5 Upplands Väsby",
        languageCode: "sv",
        regionCode: "SE",
      }),
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return fallback;
    const body = (await response.json()) as { places?: PlaceResult[] };
    const place = body.places?.find((item) => /makina/i.test(item.displayName?.text ?? ""));
    if (!place) return fallback;
    return {
      url: place.googleMapsUri || MAPS_URL,
      rating: typeof place.rating === "number" ? place.rating : null,
      count: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    };
  } catch {
    return fallback;
  }
}
