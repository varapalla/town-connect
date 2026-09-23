const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

export type SearchIntent = {
  intent: "find_business" | "find_product" | "find_service" | "find_menu" | "discover";
  category: string;
  businessName: string | null;
  locationQuery: string;
  budgetMax: number | null;
  currency: string;
  dateQuery: string | null;
  openNow: boolean;
  searchQuery: string;
  keywords: string[];
};

export type MenuItem = {
  name: string;
  price: string;
  category: string;
};

export type MenuAnalysis = {
  isMenu: boolean;
  confidence: number;
  menuText: string;
  items: MenuItem[];
};

function localFallback(message: string): SearchIntent {
  const lower = message.toLowerCase();
  const budget = message.match(/(?:under|below|less than|within|budget(?: of)?)\s*[₹rs.]?\s*([\d,]+)/i);
  const budgetMax = budget ? Number(budget[1].replace(/,/g, "")) : null;
  const openNow = /\b(open now|currently open|open today)\b/i.test(message);
  const dateMatch = message.match(/\b(today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);

  let intent: SearchIntent["intent"] = "find_business";
  if (/\b(menu|menus)\b/i.test(message)) intent = "find_menu";
  else if (/\b(buy|purchase|cake|saree|phone|laptop|jewellery|grocer(?:y|ies))\b/i.test(lower)) intent = "find_product";
  else if (/\b(repair|photographer|plumber|electrician|carpenter|salon|tuition|service)\b/i.test(lower)) intent = "find_service";

  let businessName: string | null = null;
  let locationQuery = "near me";

  if (intent === "find_menu") {
    const withoutAction = message
      .replace(/\b(get|show|find|see|view)\b/gi, "")
      .replace(/\b(menu|menus)\b/gi, "")
      .trim();
    const locationMatch = withoutAction.match(/\b(?:in|at|near)\s+(.+)$/i);
    if (locationMatch) {
      locationQuery = locationMatch[1].trim();
      businessName = withoutAction.replace(/\b(?:in|at|near)\s+.+$/i, "").trim();
    } else {
      const parts = withoutAction.split(/\s+/).filter(Boolean);
      if (parts.length > 1) {
        locationQuery = parts[parts.length - 1];
        businessName = parts.slice(0, -1).join(" ");
      } else {
        businessName = withoutAction;
      }
    }
  }

  const cleaned = message
    .replace(/(?:under|below|less than|within|budget(?: of)?)\s*[₹rs.]?\s*[\d,]+/gi, "")
    .replace(/\b(near me|around me|close to me)\b/gi, "")
    .trim();

  return {
    intent,
    category: intent === "find_menu" ? "restaurant menu" : cleaned || "local business",
    businessName,
    locationQuery,
    budgetMax,
    currency: "INR",
    dateQuery: dateMatch?.[1] ?? null,
    openNow,
    searchQuery: intent === "find_menu" && businessName ? `${businessName} ${locationQuery}` : cleaned || message,
    keywords: cleaned.split(/\s+/).filter((x) => x.length > 2).slice(0, 8),
  };
}

async function callGemini(model: string, key: string, prompt: string, schema: object, parts?: any[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  return fetch(`${url}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: parts ?? [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      },
    }),
    cache: "no-store",
  });
}

function getModels() {
  return (process.env.GEMINI_MODELS || DEFAULT_MODELS.join(","))
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

export async function parseTownQuery(message: string): Promise<SearchIntent> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const schema = {
    type: "OBJECT",
    properties: {
      intent: { type: "STRING", enum: ["find_business", "find_product", "find_service", "find_menu", "discover"] },
      category: { type: "STRING" },
      businessName: { type: "STRING", nullable: true },
      locationQuery: { type: "STRING" },
      budgetMax: { type: "NUMBER", nullable: true },
      currency: { type: "STRING" },
      dateQuery: { type: "STRING", nullable: true },
      openNow: { type: "BOOLEAN" },
      searchQuery: { type: "STRING" },
      keywords: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["intent", "category", "businessName", "locationQuery", "budgetMax", "currency", "dateQuery", "openNow", "searchQuery", "keywords"],
  };

  const prompt = `You are the intent parser for TownConnect, a local business discovery product in India.
Extract the user's request into structured search fields.

IMPORTANT MENU RULE:
If the user asks for a restaurant/business menu, set intent to "find_menu" and extract the business separately.
Example: "get manasa restaurant menu proddatur"
- intent: find_menu
- businessName: Manasa Restaurant
- locationQuery: Proddatur
- searchQuery: Manasa Restaurant Proddatur
- category: restaurant menu
Do not include the word "menu" in businessName.

Other rules:
- Do not invent a town, budget, date, availability, price, or business.
- If the user says "near me" or gives no location, locationQuery should be "near me".
- If a budget is not explicitly stated, budgetMax must be null.
- If a date is not explicitly stated, dateQuery must be null.
- openNow is true only when explicitly requested.
- searchQuery should be a concise Google Places natural-language query.
- Keep keywords short and useful.

User request: ${message}`;

  let lastError = "";
  for (const model of getModels()) {
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
              businessName: parsed.businessName || null,
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

export async function analyzeMenuImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<MenuAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const schema = {
    type: "OBJECT",
    properties: {
      isMenu: { type: "BOOLEAN" },
      confidence: { type: "NUMBER" },
      menuText: { type: "STRING" },
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            price: { type: "STRING" },
            category: { type: "STRING" },
          },
          required: ["name", "price", "category"],
        },
      },
    },
    required: ["isMenu", "confidence", "menuText", "items"],
  };

  const prompt = `
You are TownConnect's visual menu detector and OCR extractor.

Carefully inspect the entire supplied restaurant photo.

CLASSIFY THE IMAGE:
- Return isMenu=true if the image contains a restaurant menu page, menu booklet,
  menu board, food price list, or a list of food/drink items with prices.
- The image does NOT need to contain the word "MENU".
- The restaurant name does NOT need to be visible.
- A photographed page with food names and prices IS a menu.
- A photo containing only prepared food, restaurant interiors, signs, or people is NOT a menu.

VERY IMPORTANT:
Do not require a special layout. Menu pages may have decorative backgrounds,
logos, photographs, columns, or partial pages.

OCR RULES:
- Read all clearly visible menu text.
- Extract as many menu items as can be read reliably.
- Preserve the visible spelling.
- Preserve the visible price format, e.g. "150/-", "₹150", "150", etc.
- Do not invent or infer a price that cannot be read.
- If an item is readable but its price is not readable, set price to "".
- Use the visible section heading as category when available, such as "VEG-STARTERS".
- Do not invent categories.
- menuText should contain the clearly visible menu text in reading order.

EXAMPLE:
If the image shows:
VEG-STARTERS
CHILLI GOBI 150/-
GOBI MANCHURIA 150/-
PANEER-65 250/-
then this must be classified as a menu and those items should be extracted.

Return only the requested JSON structure.
`;

  const base64 = imageBuffer.toString("base64");

  for (const model of getModels()) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await callGemini(model, key, prompt, schema, [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ]);

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (text) {
            const parsed = JSON.parse(text) as MenuAnalysis;
            return {
              isMenu: Boolean(parsed.isMenu),
              confidence:
                typeof parsed.confidence === "number"
                  ? Math.max(0, Math.min(1, parsed.confidence))
                  : 0,
              menuText: parsed.menuText || "",
              items: Array.isArray(parsed.items)
                ? parsed.items
                    .filter((item) => item && typeof item.name === "string")
                    .map((item) => ({
                      name: item.name.trim(),
                      price: typeof item.price === "string" ? item.price.trim() : "",
                      category:
                        typeof item.category === "string"
                          ? item.category.trim()
                          : "",
                    }))
                : [],
            };
          }
        }

        if (response.status !== 503 && response.status !== 429) break;
      } catch (error) {
        console.warn(`Menu image analysis failed with ${model}`, error);
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
      }
    }
  }

  return {
    isMenu: false,
    confidence: 0,
    menuText: "",
    items: [],
  };
}
