export const GOOGLE_PLACES_BASE = "https://places.googleapis.com/v1";

export function getGoogleApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  return key;
}

export function placesFieldMask(fields: string[]) {
  return fields.join(",");
}

export function normalizePlace(place: any) {
  return {
    id: place.id ?? "",
    name: place.displayName?.text ?? "",
    address: place.formattedAddress ?? "",
    location: place.location
      ? { latitude: place.location.latitude, longitude: place.location.longitude }
      : null,
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
    photos: place.photos ?? [],
    reviews: place.reviews ?? []
  };
}
