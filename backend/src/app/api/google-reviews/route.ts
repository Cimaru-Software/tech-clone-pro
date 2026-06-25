import { NextResponse } from "next/server";

type GoogleReview = {
  author_name?: string;
  rating?: number;
  text?: string | { text?: string; languageCode?: string };
  relative_time_description?: string;
  profile_photo_url?: string;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
};

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    if (!apiKey || !placeId) {
      return NextResponse.json(
        {
          reviews: [],
          rating: null,
          userRatingCount: null,
          error: "Faltan GOOGLE_MAPS_API_KEY o GOOGLE_PLACE_ID",
        },
        { status: 200 },
      );
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es&regionCode=ec`;
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "*",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { reviews: [], rating: null, userRatingCount: null, error: text || `Google Places error ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews.slice(0, 8).map((review: GoogleReview) => ({
      author_name: review.authorAttribution?.displayName || review.author_name || "Usuario de Google",
      rating: review.rating || 5,
      text: typeof review.text === "string" ? review.text : review.text?.text || "",
      relative_time_description: review.relative_time_description || "",
      profile_photo_url: review.authorAttribution?.photoUri || review.profile_photo_url || "",
    })) : [];

    return NextResponse.json({
      name: data.displayName?.text || "",
      rating: data.rating ?? null,
      userRatingCount: data.userRatingCount ?? null,
      reviews,
    });
  } catch (error) {
    console.error("[google-reviews GET]", error);
    return NextResponse.json(
      { reviews: [], rating: null, userRatingCount: null, error: "No se pudieron obtener las reseñas" },
      { status: 500 },
    );
  }
}
