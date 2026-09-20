// Cloudflare Pages Function -- deployed automatically alongside the app
// (any file under /functions maps to a route: this one serves
// POST /api/analyze-food). This is the real, server-side piece that calls
// Claude's vision API to analyze a meal photo. It never runs in the
// browser, so the real ANTHROPIC_API_KEY never reaches the client bundle.
//
// Setup: in the Cloudflare Pages project -> Settings -> Environment
// variables, add ANTHROPIC_API_KEY (Production and Preview) with a real
// Anthropic API key. No other configuration is needed -- src/lib/foodAI.ts
// already posts to '/api/analyze-food' by default.

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface AnalyzeFoodRequest {
  image: string; // base64-encoded JPEG, no data: prefix
}

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. You will be shown a photo of a meal.
Identify the food(s) and estimate total nutrition for the visible portion.
Respond with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{"name": "short food name", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "serving": "e.g. 1 plate (~350g)", "confidence": "high" | "medium" | "low"}
All numeric values are grams except calories (kcal). Use your best visual estimate of portion size.
If you cannot identify food in the image, still return your best guess with "confidence": "low".`;

function corsHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }

  let body: AnalyzeFoodRequest;
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
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
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
      return new Response(JSON.stringify({ error: 'upstream_error' }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    const data = (await anthropicRes.json()) as { content?: { type: string; text?: string }[] };
    const textBlock = (data.content || []).find((c) => c.type === 'text');
    const rawText = textBlock?.text || '{}';
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

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error('analyze-food handler error:', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
};
