const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

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

function localFallback(message: string): SearchIntent {
  const lower = message.toLowerCase();
  const budget = message.match(/(?:under|below|less than|within|budget(?: of)?)\s*[₹rs.]?\s*([\d,]+)/i);
  const budgetMax = budget ? Number(budget[1].replace(/,/g, "")) : null;
  const openNow = /\b(open now|currently open|open today)\b/i.test(message);
  const dateMatch = message.match(/\b(today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);

  let intent: SearchIntent["intent"] = "find_business";
  if (/\b(buy|purchase|cake|saree|phone|laptop|jewellery|grocer(?:y|ies))\b/i.test(lower)) intent = "find_product";
  else if (/\b(repair|photographer|plumber|electrician|carpenter|salon|tuition|service)\b/i.test(lower)) intent = "find_service";

  const cleaned = message
    .replace(/(?:under|below|less than|within|budget(?: of)?)\s*[₹rs.]?\s*[\d,]+/gi, "")
    .replace(/\b(near me|around me|close to me)\b/gi, "")
    .trim();

  return {
    intent,
    category: cleaned || "local business",
    locationQuery: /\bnear me\b/i.test(message) ? "near me" : "near me",
    budgetMax,
    currency: "INR",
    dateQuery: dateMatch?.[1] ?? null,
    openNow,
    searchQuery: cleaned || message,
    keywords: cleaned.split(/\s+/).filter((x) => x.length > 2).slice(0, 8),
  };
}

async function callGemini(model: string, key: string, prompt: string, schema: object) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  return fetch(`${url}?key=${encodeURIComponent(key)}`, {
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
}

export async function parseTownQuery(message: string): Promise<SearchIntent> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const models = (process.env.GEMINI_MODELS || DEFAULT_MODELS.join(","))
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const schema = {
    type: "OBJECT",
    properties: {
      intent: { type: "STRING", enum: ["find_business", "find_product", "find_service", "discover"] },
      category: { type: "STRING" },
      locationQuery: { type: "STRING" },
      budgetMax: { type: "NUMBER", nullable: true },
      currency: { type: "STRING" },
      dateQuery: { type: "STRING", nullable: true },
      openNow: { type: "BOOLEAN" },
      searchQuery: { type: "STRING" },
      keywords: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["intent", "category", "locationQuery", "budgetMax", "currency", "dateQuery", "openNow", "searchQuery", "keywords"],
  };

  const prompt = `You are the intent parser for TownConnect, a local business discovery product in India.
Extract the user's request into structured search fields.
Rules:
- Do not invent a town, budget, date, availability, price, or business.
- If the user says "near me" or gives no location, locationQuery should be "near me".
- If a budget is not explicitly stated, budgetMax must be null.
- If a date is not explicitly stated, dateQuery must be null.
- openNow is true only when the user asks for open now/currently open.
- searchQuery should be a concise Google Places natural-language query using the category/service/product and explicit location when supplied.
- Do not include unsupported claims such as exact prices.
- Keep keywords short and useful.
User request: ${message}`;

  let lastError = "";
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await callGemini(model, key, prompt, schema);
        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
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
        }

        const details = await response.text();
        lastError = `${model} returned ${response.status}: ${details}`;

        // 503 = temporary model capacity issue; 429 = rate limit/quota.
        if (response.status !== 503 && response.status !== 429) break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }

  console.warn(`Gemini unavailable; using local intent fallback. ${lastError}`);
  return localFallback(message);
}
