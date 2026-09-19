# AI Food Photo Scanner — setup

What's already working, no setup needed:
- Real camera access (`getUserMedia`) opens on the "AI Food Photo" option in the Nutrition tab's add-food sheet.
- Photo capture, retake, loading state, error state, and the results sheet (calories/protein/carbs/fat/fiber, with an editable meal selector and "Add to Meal") are all fully wired to the app's existing state.

What you still need to deploy (one small backend function):
The app never calls the AI vision API directly from the browser — that would mean shipping your API key inside the app where anyone could extract it. Instead it POSTs the photo to `/api/analyze-food` (configurable via `VITE_FOOD_AI_ENDPOINT` in `.env`), and a small server-side function you deploy does the actual AI call.

1. Copy `server/analyze-food.example.ts` to wherever your host expects functions:
   - Vercel → `api/analyze-food.ts`
   - Netlify → `netlify/functions/analyze-food.ts`
   - Supabase → port the `fetch()` call into a new Edge Function
   - Plain Node/Express → mount it as a POST route
2. Set `ANTHROPIC_API_KEY` (no `VITE_` prefix) as a server-side environment variable on that host.
3. If your function ends up at a different path than `/api/analyze-food`, set `VITE_FOOD_AI_ENDPOINT` in `.env` to match.

That's it — the frontend code doesn't change either way.
