// Cloudflare Worker entry point.
//
// Handles POST /api/analyze-food with real server-side logic (calls
// Google's Gemini vision API to analyze a meal photo), and serves the
// built static site (Vite's `dist` output, via the ASSETS binding from
// wrangler.jsonc) for every other route.
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

const GEMINI_MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. You will be shown a photo of a meal.
Identify the food(s) and estimate total nutrition for the visible portion.
Respond with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{"name": "short food name", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "serving": "e.g. 1 plate (~350g)", "confidence": "high" | "medium" | "low"}
All numeric values are grams except calories (kcal). Use your best visual estimate of portion size.
If you cannot identify food in the image, still return your best guess with "confidence": "low".`;

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
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return new Response(JSON.stringify({ error: 'upstream_error' }), {
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
      return new Response(JSON.stringify({ error: 'parse_error' }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders() });
  } catch (err) {
    console.error('analyze-food handler error:', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
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

    return env.ASSETS.fetch(request);
  },
};
