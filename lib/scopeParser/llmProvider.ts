/**
 * Vendor-agnostic LLM scope parser. Calls an OpenAI-compatible chat-completions
 * endpoint over `fetch` (no SDK dependency) to extract scope slots from free
 * text.
 *
 * Hard guarantees (see `types.ts`):
 * - The LLM ONLY classifies intent and extracts slots. It never computes money,
 *   tiers, or touches the DB. The system prompt below forbids reasoning about
 *   price. Downstream, the conversation service re-validates with `scopeSchema`
 *   before any deterministic pricing call.
 * - `parse()` NEVER throws. On timeout, network error, non-2xx, or invalid JSON
 *   it returns `UNPARSEABLE_SCOPE` so the caller falls back to numeric prompts.
 */
import {
  llmApiBaseUrl,
  llmApiKey,
  llmModel,
  llmTimeoutMs,
} from "@/lib/instagram/config";
import { parseLlmResponse, UNPARSEABLE_SCOPE } from "./schema";
import type { ParsedScope, ScopeParserProvider } from "./types";

/** Cap input length to bound cost/latency and reduce prompt-injection surface. */
const MAX_INPUT_CHARS = 500;

/**
 * Fixed system prompt. Instructs the model to emit ONLY JSON matching the slot
 * schema and to never reason about pricing. Keep this stable; the schema in
 * `schema.ts` is the contract.
 */
const SYSTEM_PROMPT = [
  "You are a slot-extraction component for an influencer-collab assistant.",
  "Extract ONLY the requested deliverable scope from the user's message.",
  "You MUST NOT compute prices, rates, tiers, or money of any kind.",
  "Output ONLY a single JSON object, no prose, with EXACTLY these keys:",
  '{"reelsCount": number|null, "storiesCount": number|null, "adUsageDays": number|null, "confidence": number, "needsClarification": boolean}',
  "- reelsCount/storiesCount: integers 0-5, or null if not stated.",
  "- adUsageDays: one of 0, 30, 90, or null if not stated or not one of those.",
  "- confidence: 0..1, how sure you are about the extracted slots.",
  "- needsClarification: true if the message is not a parseable scope.",
  "A bare mention of 'a story' means 1 story. 'no usage' means adUsageDays 0.",
].join("\n");

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } | null } | null>;
};

export class LlmScopeParser implements ScopeParserProvider {
  async parse(message: string): Promise<ParsedScope> {
    const apiKey = llmApiKey();
    if (!apiKey) return UNPARSEABLE_SCOPE;

    const input = message.slice(0, MAX_INPUT_CHARS);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), llmTimeoutMs());

    try {
      const response = await fetch(`${llmApiBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: llmModel(),
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: input },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) return UNPARSEABLE_SCOPE;

      const data = (await response.json()) as ChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) return UNPARSEABLE_SCOPE;

      // Decode + validate + normalize the model's JSON. Pure and testable.
      return parseLlmResponse(content);
    } catch {
      // Timeout / network / parse error: fall back, never throw.
      return UNPARSEABLE_SCOPE;
    } finally {
      clearTimeout(timer);
    }
  }
}
