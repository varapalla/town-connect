export const GOOGLE_PLACES_BASE = "https://places.googleapis.com/v1";

export function getGoogleApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  return key;
}

export const SEARCH_FIELDS = [
  "places.id","places.displayName","places.formattedAddress","places.location",
  "places.primaryType","places.rating","places.userRatingCount","places.googleMapsUri",
  "places.nationalPhoneNumber","places.websiteUri","places.currentOpeningHours","places.photos"
].join(",");

export const DETAIL_FIELDS = [
  "id","displayName","formattedAddress","location","primaryType","types","rating",
  "userRatingCount","nationalPhoneNumber","internationalPhoneNumber","websiteUri",
  "googleMapsUri","currentOpeningHours","regularOpeningHours","photos","reviews"
].join(",");

export function normalizePlace(place: any) {
  return {
    id: place.id ?? "",
    name: place.displayName?.text ?? "",
    address: place.formattedAddress ?? "",
    location: place.location ? { latitude: place.location.latitude, longitude: place.location.longitude } : null,
    type: place.primaryType ?? null,
    types: place.types ?? [],
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? 0,
    phone: place.nationalPhoneNumber ?? null,
    internationalPhone: place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    openingHours: place.currentOpeningHours ?? null,
    regularOpeningHours: place.regularOpeningHours ?? null,
    photos: (place.photos ?? []).map((p: any) => ({
      name: p.name,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
      authorAttributions: p.authorAttributions ?? []
    })),
    reviews: place.reviews ?? []
  };
}
