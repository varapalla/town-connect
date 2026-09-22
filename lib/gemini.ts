const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type SearchIntent = {
  intent: "find_business" | "find_product" | "find_service" | "discover";
  category: string;
  locationQuery: string;
  budgetMax: number | null;
  currency: string;
  dateQuery: string | null;
  openNow: boolean;
  searchQuery: string;
  keywords: string[];
};

export async function parseTownQuery(message: string): Promise<SearchIntent> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const schema = {
    type: "OBJECT",
    properties: {
      intent: {
        type: "STRING",
        enum: ["find_business", "find_product", "find_service", "discover"],
      },
      category: { type: "STRING" },
      locationQuery: { type: "STRING" },
      budgetMax: { type: "NUMBER", nullable: true },
      currency: { type: "STRING" },
      dateQuery: { type: "STRING", nullable: true },
      openNow: { type: "BOOLEAN" },
      searchQuery: { type: "STRING" },
      keywords: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: [
      "intent",
      "category",
      "locationQuery",
      "budgetMax",
      "currency",
      "dateQuery",
      "openNow",
      "searchQuery",
      "keywords",
    ],
  };

  const prompt = `You are the intent parser for TownConnect, a local business discovery product in India.
Extract the user's request into structured search fields.
Rules:
- Do not invent a town, budget, date, availability, price, or business.
- If the user says "near me" or gives no location, locationQuery should be "near me".
- If a budget is not explicitly stated, budgetMax must be null.
- If a date is not explicitly stated, dateQuery must be null.
- openNow is true only when the user asks for open now/currently open.
- searchQuery should be a concise Google Places natural-language query using the category/service/product and explicit location when supplied. Do not include unsupported claims such as exact prices.
- For product requests, category can be something like "birthday cake" or "saree shop".
- For service requests, category can be something like "AC repair" or "wedding photographer".
- Keep keywords short and useful.
User request: ${message}`;

  const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini intent parsing failed (${response.status}): ${details}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no intent result");

  const parsed = JSON.parse(text) as SearchIntent;
  return {
    intent: parsed.intent ?? "discover",
    category: parsed.category ?? "local business",
    locationQuery: parsed.locationQuery ?? "near me",
    budgetMax: typeof parsed.budgetMax === "number" ? parsed.budgetMax : null,
    currency: parsed.currency || "INR",
    dateQuery: parsed.dateQuery || null,
    openNow: Boolean(parsed.openNow),
    searchQuery: parsed.searchQuery || message,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
  };
}
