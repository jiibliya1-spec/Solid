// AI progress-photo analysis.
//
// Same pattern as foodAI.ts: this calls YOUR OWN backend endpoint
// (`/api/analyze-progress`), never the vision API directly, so the real
// API key never ships in the browser bundle. See worker/index.ts for the
// server-side handler.
//
// Configure the endpoint URL via VITE_PROGRESS_AI_ENDPOINT in your .env
// file. If not set, it defaults to the relative path '/api/analyze-progress'.

export interface ProgressAnalysis {
  summary: string;
  improvements: string[];
  focusAreas: string[];
}

export class ProgressAIError extends Error {}

const ENDPOINT = (import.meta.env.VITE_PROGRESS_AI_ENDPOINT as string | undefined) || '/api/analyze-progress';

export interface ProgressAnalysisInput {
  /** Base64 JPEG (data: prefix optional) of the photo being analyzed. */
  latestImage: string;
  /** Base64 JPEG of an earlier progress photo, for a direct comparison. */
  earliestImage?: string;
  startWeight?: number;
  currentWeight?: number;
  goalWeight?: number;
  weeksElapsed?: number;
  heightCm?: number;
}

const strip = (img: string) => (img.includes(',') ? img.split(',')[1] : img);

/**
 * Sends a progress photo (and optionally an earlier one for comparison),
 * plus the client's transformation stats, to the backend and returns a
 * structured coaching read: what's visibly/numerically improved, and what
 * to focus on next toward the stated goal weight.
 */
export async function analyzeProgressPhoto(input: ProgressAnalysisInput): Promise<ProgressAnalysis> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latestImage: strip(input.latestImage),
        earliestImage: input.earliestImage ? strip(input.earliestImage) : undefined,
        startWeight: input.startWeight,
        currentWeight: input.currentWeight,
        goalWeight: input.goalWeight,
        weeksElapsed: input.weeksElapsed,
        heightCm: input.heightCm,
      }),
    });
  } catch {
    throw new ProgressAIError('network');
  }

  if (!response.ok) {
    throw new ProgressAIError(`request_failed_${response.status}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ProgressAIError('invalid_response');
  }

  const d = data as Partial<ProgressAnalysis>;
  if (typeof d.summary !== 'string' || !Array.isArray(d.improvements) || !Array.isArray(d.focusAreas)) {
    throw new ProgressAIError('malformed_response');
  }

  return {
    summary: d.summary,
    improvements: d.improvements.filter((x): x is string => typeof x === 'string'),
    focusAreas: d.focusAreas.filter((x): x is string => typeof x === 'string'),
  };
}
