// AI food-photo analysis.
//
// IMPORTANT: this calls YOUR OWN backend endpoint (`/api/analyze-food`), not
// the Anthropic API directly. Calling Anthropic (or any AI vision API) straight
// from the browser would mean shipping your secret API key inside the app
// bundle, where anyone can read it. Instead, this function sends the photo to
// a small server-side function you deploy yourself, which holds the real API
// key and forwards the request. See `server/analyze-food.example.ts` for a
// ready-to-deploy example (Vercel/Netlify/Node style) that calls Claude's
// vision API server-side.
//
// Configure the endpoint URL via VITE_FOOD_AI_ENDPOINT in your .env file.
// If not set, it defaults to the relative path '/api/analyze-food'.

export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving: string;
  confidence: 'high' | 'medium' | 'low';
}

export class FoodAIError extends Error {}

const ENDPOINT = (import.meta.env.VITE_FOOD_AI_ENDPOINT as string | undefined) || '/api/analyze-food';

/**
 * Sends a captured meal photo (base64 JPEG, no data: prefix needed either way)
 * to the backend for analysis and returns a structured nutrition estimate.
 */
export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysis> {
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: cleanBase64 }),
    });
  } catch {
    throw new FoodAIError('network');
  }

  if (!response.ok) {
    throw new FoodAIError(`request_failed_${response.status}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new FoodAIError('invalid_response');
  }

  const d = data as Partial<FoodAnalysis>;
  if (
    typeof d.name !== 'string' ||
    typeof d.calories !== 'number' ||
    typeof d.protein !== 'number' ||
    typeof d.carbs !== 'number' ||
    typeof d.fat !== 'number'
  ) {
    throw new FoodAIError('malformed_response');
  }

  return {
    name: d.name,
    calories: Math.round(d.calories),
    protein: Math.round((d.protein ?? 0) * 10) / 10,
    carbs: Math.round((d.carbs ?? 0) * 10) / 10,
    fat: Math.round((d.fat ?? 0) * 10) / 10,
    fiber: Math.round((d.fiber ?? 0) * 10) / 10,
    serving: d.serving || '1 serving',
    confidence: d.confidence === 'high' || d.confidence === 'low' ? d.confidence : 'medium',
  };
}
