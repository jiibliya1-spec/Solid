# AI Food Photo Scanner — setup

What's already working, no setup needed:
- Real camera access (`getUserMedia`) opens on the "AI Food Photo" option in the Nutrition tab's add-food sheet.
- Photo capture, retake, loading state, error state, and the results sheet (calories/protein/carbs/fat/fiber, with an editable meal selector and "Add to Meal") are all fully wired to the app's existing state.

What you still need to do (one API key, no code changes):
The app never calls the AI vision API directly from the browser -- that would mean shipping your API key inside the app where anyone could extract it. Instead it POSTs the photo to `/api/analyze-food`, which `worker/index.ts` (this project's Cloudflare Worker) handles by calling Google's Gemini vision API server-side.

1. Get a free API key from Google AI Studio: https://aistudio.google.com/apikey
2. In the Cloudflare dashboard: Workers & Pages -> solid -> Settings -> Variables and secrets -> Add variable.
   - Name: `GOOGLE_AI_API_KEY`
   - Value: the key from step 1
   - Type: Secret
   - Save (and deploy, if prompted)
3. That's it -- `wrangler.jsonc` already wires this project's build (the `dist` folder) together with `worker/index.ts` into one Worker, so the same deployment serves the app AND handles `/api/analyze-food`.

Note: this project used to be deployed as assets-only (no Worker script), which is why environment variables couldn't be added at all ("Variables cannot be added to a Worker that only has static assets"). `wrangler.jsonc` + `worker/index.ts` fixed that.

`server/analyze-food.example.ts` is kept only as a reference for the request/response shape if you ever want to swap in a different host or AI provider -- it isn't used by this deployment.
