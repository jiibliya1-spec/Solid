// Cloudflare Worker entry point.
//
// Handles POST /api/analyze-food and POST /api/analyze-progress with real
// server-side logic (calls Google's Gemini vision API to analyze a meal
// photo, or a progress photo against the user's transformation goal), and
// serves the built static site (Vite's `dist` output, via the ASSETS
// binding from wrangler.jsonc) for every other route.
//
// This replaces functions/api/analyze-food.ts: that file follows the
// classic Cloudflare Pages Functions convention, which only applies when
// a project has no `main` Worker script. Once wrangler.jsonc declares
// `main: "worker/index.ts"`, THIS file is what actually runs, and it's
// also what unlocks being able to set environment variables/secrets at
// all in the dashboard.
//
// Setup: get a free API key at https://aistudio.google.com/apikey, then
// in Cloudflare dashboard -> Workers & Pages -> solid -> Settings ->
// Variables and secrets, add GOOGLE_AI_API_KEY with that key.

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  GOOGLE_AI_API_KEY: string;
}

const GEMINI_MODEL = 'gemini-3.6-flash';

// A better-structured prompt measurably improves vision-model nutrition
// accuracy: making the model reason about portion size against real
// reference objects, and explicitly prompting it not to under-count
// hidden calories (oil, sauce, dressing), catches the two biggest sources
// of error in photo-based calorie estimation. Note this is a real limit
// of the technique, not just prompting -- no photo-based estimator (this
// one included) can match a kitchen scale; "analysis" is returned so a
// future UI could show the reasoning, and is otherwise ignored by the app.
const SYSTEM_PROMPT = `You are an expert nutrition estimator analyzing a photo of a meal for a fitness tracking app. The person is logging real food, so work carefully and give your best single-point estimate -- do not hedge toward round numbers.

Follow this process before answering:
1. Identify every distinct food and drink item visible (main dish, sides, sauces, garnishes, drinks).
2. Estimate each item's portion size using reference objects visible in the frame -- a standard dinner plate is about 26cm across, a fork is about 20cm, a standard glass holds about 250ml, a closed fist is roughly 100g of most foods. Judge the depth/fill of the portion, not just its top-down footprint.
3. Account for calories that are easy to miss: cooking oil/butter, dressings, sauces, sugar or cream in drinks, breading/frying. Typical home-cooked or restaurant portions include more added fat and sugar than the leanest possible version of the same dish -- lean your estimate accordingly.
4. Sum the nutrition across all items into one combined total for the whole visible plate/meal.
5. Before answering, sanity-check your total against what a real portion of that meal realistically weighs and contains.

Respond with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{"analysis": "1-2 sentences: items identified and how you estimated portion size", "name": "short food name (main dish, or 'Mixed plate' if several unrelated items)", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "serving": "your estimated portion, e.g. '1 plate (~380g)'", "confidence": "high" | "medium" | "low"}

All numeric values are grams except calories (kcal), and are TOTALS for the visible portion, not per 100g.
Use "confidence": "high" only for a single, clearly identifiable food in a standard portion (e.g. one apple, one boiled egg). Use "low" for mixed/homemade dishes, poor lighting, an unclear portion size, or a partially visible plate.
If you cannot identify food in the image at all, still return your best guess with "confidence": "low" and say so briefly in "analysis".`;

// Reviews a progress photo (optionally against the user's earliest one)
// alongside their stated stats, and gives a short honest read on visible
// change plus concrete next-focus suggestions. Kept deliberately
// encouraging-but-specific rather than generic praise, and explicitly
// told to stay off medical/diagnostic ground -- this is fitness-coaching
// commentary, not a body assessment.
const PROGRESS_SYSTEM_PROMPT = `You are an encouraging but honest fitness coach reviewing a client's transformation progress photo(s) for a fitness tracking app. You are not a doctor -- never diagnose, never comment on health risk, never make claims about body fat percentage or medical status from the photo. Stay focused on fitness-coaching observations: posture, visible muscle tone/definition, and how the photo(s) line up with their stated numbers.

You will be given the client's stats (starting weight, current weight, goal weight, height if known, weeks into the program) and one or two photos:
- If only ONE photo is provided, it is their most recent progress photo. Base your read on that photo plus their numeric stats -- do not invent a before/after comparison you can't see.
- If TWO photos are provided, the first is their EARLIEST progress photo and the second is their MOST RECENT one. Compare them directly and be specific about what visibly changed (or note plainly if you can't tell much from the angle/lighting/clothing).

Keep it specific and grounded in what's actually visible or in the numbers -- avoid generic gym-poster language. Be warm and motivating, never critical or body-shaming, and never suggest extreme measures (crash dieting, excessive exercise, etc).

Respond with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{"summary": "2-3 sentence honest overall read combining what's visible and the numbers", "improvements": ["short phrase describing one specific thing that's visibly or numerically improved", "..."], "focusAreas": ["one short, concrete, actionable suggestion for what to prioritize next toward their goal weight", "..."]}

Give 2-4 items in "improvements" (fewer if genuinely little has changed yet -- don't invent progress that isn't there) and 2-4 items in "focusAreas". If there's only one photo and not much to go on yet, say so plainly in "summary" and keep "focusAreas" focused on general next steps toward their stated goal.`;

function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleAnalyzeFood(request: Request, apiKey: string): Promise<Response> {
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }

  let body: { image?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  if (!body.image) {
    return new Response(JSON.stringify({ error: 'missing_image' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${SYSTEM_PROMPT}\n\nAnalyze this meal.` },
                { inline_data: { mime_type: 'image/jpeg', data: body.image } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.15 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      // TEMP DEBUG: surfacing the real upstream error/status to the client
      // to diagnose a live failure. Remove once resolved.
      return new Response(JSON.stringify({ error: 'upstream_error', debug_status: geminiRes.status, debug_body: errText }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    const data = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Could not parse model output as JSON:', rawText);
      return new Response(JSON.stringify({ error: 'parse_error', debug_raw: rawText }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders() });
  } catch (err) {
    console.error('analyze-food handler error:', err);
    return new Response(JSON.stringify({ error: 'internal_error', debug_err: String(err) }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

interface AnalyzeProgressBody {
  latestImage?: string;
  earliestImage?: string;
  startWeight?: number;
  currentWeight?: number;
  goalWeight?: number;
  weeksElapsed?: number;
  heightCm?: number;
}

async function handleAnalyzeProgress(request: Request, apiKey: string): Promise<Response> {
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }

  let body: AnalyzeProgressBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  if (!body.latestImage) {
    return new Response(JSON.stringify({ error: 'missing_image' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const statsLines = [
    body.startWeight != null ? `Starting weight: ${body.startWeight} kg` : null,
    body.currentWeight != null ? `Current weight: ${body.currentWeight} kg` : null,
    body.goalWeight != null ? `Goal weight: ${body.goalWeight} kg` : null,
    body.heightCm != null ? `Height: ${body.heightCm} cm` : null,
    body.weeksElapsed != null ? `Weeks into the program: ${body.weeksElapsed}` : null,
  ].filter(Boolean).join('\n');

  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: `${PROGRESS_SYSTEM_PROMPT}\n\nClient stats:\n${statsLines || 'Not provided.'}` },
  ];

  if (body.earliestImage) {
    parts.push({ text: 'EARLIEST photo:' });
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: body.earliestImage } });
    parts.push({ text: 'MOST RECENT photo:' });
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: body.latestImage } });
  } else {
    parts.push({ text: 'Most recent (only) photo:' });
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: body.latestImage } });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      // TEMP DEBUG: surfacing the real upstream error/status to the client
      // to diagnose a live failure. Remove once resolved.
      return new Response(JSON.stringify({ error: 'upstream_error', debug_status: geminiRes.status, debug_body: errText }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    const data = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Could not parse model output as JSON:', rawText);
      return new Response(JSON.stringify({ error: 'parse_error', debug_raw: rawText }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders() });
  } catch (err) {
    console.error('analyze-progress handler error:', err);
    return new Response(JSON.stringify({ error: 'internal_error', debug_err: String(err) }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/analyze-food') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }
      if (request.method === 'POST') {
        return handleAnalyzeFood(request, env.GOOGLE_AI_API_KEY);
      }
      return new Response('Method not allowed', { status: 405 });
    }

    if (url.pathname === '/api/analyze-progress') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }
      if (request.method === 'POST') {
        return handleAnalyzeProgress(request, env.GOOGLE_AI_API_KEY);
      }
      return new Response('Method not allowed', { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
