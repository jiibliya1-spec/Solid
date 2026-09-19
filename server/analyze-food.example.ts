// EXAMPLE server-side function — deploy this, don't ship it to the browser.
//
// This is the piece that actually calls Claude's vision API. It holds your
// real ANTHROPIC_API_KEY as a server-side environment variable (never
// VITE_-prefixed, so Vite never bundles it into client code).
//
// Where this file goes depends on where you deploy:
//   - Vercel:  rename to  api/analyze-food.ts          (Vercel Functions)
//   - Netlify: rename to  netlify/functions/analyze-food.ts
//   - Supabase: port the fetch() call below into a Supabase Edge Function
//               (`supabase functions new analyze-food`) — the request body
//               and Anthropic call are identical, only the handler wrapper
//               differs.
//   - Plain Node/Express: mount this as a POST route.
//
// Then set VITE_FOOD_AI_ENDPOINT in the app's .env to wherever this ends up
// (e.g. '/api/analyze-food' for Vercel/Netlify, or your Supabase Edge
// Function URL).

interface AnalyzeFoodRequest {
  image: string; // base64-encoded JPEG, no data: prefix
}

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. You will be shown a photo of a meal.
Identify the food(s) and estimate total nutrition for the visible portion.
Respond with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{"name": "short food name", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "serving": "e.g. 1 plate (~350g)", "confidence": "high" | "medium" | "low"}
All numeric values are grams except calories (kcal). Use your best visual estimate of portion size.
If you cannot identify food in the image, still return your best guess with "confidence": "low".`;

// Vercel Functions handler signature (Request in, Response out).
// Adapt the function signature for your platform if different.
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), { status: 500 });
  }

  let body: AnalyzeFoodRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400 });
  }

  if (!body.image) {
    return new Response(JSON.stringify({ error: 'missing_image' }), { status: 400 });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: body.image } },
              { type: 'text', text: 'Analyze this meal.' },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText);
      return new Response(JSON.stringify({ error: 'upstream_error' }), { status: 502 });
    }

    const data = await anthropicRes.json();
    const textBlock = (data.content || []).find((c: { type: string }) => c.type === 'text');
    const rawText: string = textBlock?.text || '{}';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Could not parse model output as JSON:', rawText);
      return new Response(JSON.stringify({ error: 'parse_error' }), { status: 502 });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('analyze-food handler error:', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
}
