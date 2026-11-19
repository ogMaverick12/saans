import type { LlmClient, LlmRequest } from "@/lib/llm/client";
import type { Ask, Plan } from "@/lib/llm/plan-schema";

/**
 * A complete plan that satisfies PlanSchema.
 */
export const VALID_PLAN: Plan = {
  airSummary: {
    headline: "Hazy day, plan a quieter morning",
    explanation:
      "PM2.5 is elevated today. Keep outdoor time short and close windows at peak hours.",
    sensitiveGroupNote:
      "Children and older adults should stay indoors where possible.",
  },
  dailyRoutine: [
    {
      timeBlock: "early_morning",
      title: "Check the air before going out",
      actions: ["Look at the cleanest window", "Keep the walk short"],
      factorIds: ["shift-outdoor-activity", "not-a-factor"],
    },
    {
      timeBlock: "morning",
      title: "Wear a fitted mask on the commute",
      actions: ["Use an N95 mask", "Check the seal around your nose"],
      factorIds: ["n95-mask"],
    },
    {
      timeBlock: "afternoon",
      title: "Keep windows closed at peak",
      actions: [
        "Close street-facing windows",
        "Run the purifier in the main room",
      ],
      factorIds: ["seal-windows-at-peak", "hepa-purifier"],
    },
    {
      timeBlock: "evening",
      title: "Cook with the exhaust fan on",
      actions: [
        "Start the fan before cooking",
        "Keep it running for ten minutes after",
      ],
      factorIds: ["cooking-exhaust"],
    },
  ],
  indoorHacks: [
    {
      title: "Run the purifier in the room you use most",
      howTo: "Close the doors and windows and run it on a medium setting.",
      cost: "free",
      effort: "easy",
      factorIds: ["hepa-purifier", "ghost-factor"],
    },
    {
      title: "Build a box-fan filter",
      howTo: "Tape a MERV 13 filter to a box fan and face it into the room.",
      cost: "low",
      effort: "moderate",
      factorIds: ["diy-box-fan-filter"],
    },
    {
      title: "Wet-mop the floors",
      howTo: "Use a damp mop instead of dry sweeping settled dust.",
      cost: "free",
      effort: "easy",
      factorIds: ["wet-mop-dust"],
    },
  ],
  sustainableAlternatives: [
    {
      area: "commute",
      swap: "Walk or cycle for short trips",
      whyItHelps: "It avoids tailpipe particles and saves carbon.",
      communityBenefit:
        "Fewer short car trips mean cleaner air on your street.",
      factorIds: ["walk-or-cycle", "ghost-factor"],
    },
    {
      area: "commute",
      swap: "Take the metro or bus",
      whyItHelps: "Shared transport emits less per passenger.",
      communityBenefit: "Reliable public transport cuts traffic and smoke.",
      factorIds: ["metro-or-bus"],
    },
    {
      area: "waste",
      swap: "Compost leaves instead of burning them",
      whyItHelps: "Burning waste adds fine particles to the air.",
      communityBenefit: "Neighbours breathe less smoke in the evening.",
      factorIds: ["avoid-open-burning"],
    },
  ],
  communityActions: [
    {
      title: "Share the daily air reading",
      description: "Tell neighbours when the cleanest outdoor window is.",
    },
    {
      title: "Agree on no-burn evenings",
      description: "Ask the local group to avoid burning leaves and rubbish.",
    },
  ],
  doctorNote: null,
};

/**
 * A complete answer that satisfies AskSchema.
 */
export const VALID_ASK: Ask = {
  answer: "The cleanest window is early afternoon, so plan errands then.",
  followUps: ["What about the evening?", "Is the purifier enough?"],
};

/**
 * Fake client that replays configured replies and records requests.
 */
export class FakeLlmClient implements LlmClient {
  readonly requests: LlmRequest[] = [];

  private readonly replies: readonly (string | Error)[];

  /**
   * Stores the replies in call order.
   */
  constructor(replies: readonly (string | Error)[]) {
    this.replies = replies;
  }

  /**
   * Records the request and returns or throws the next configured reply.
   */
  async complete(request: LlmRequest): Promise<string> {
    this.requests.push(request);
    const reply = this.replies[this.requests.length - 1];
    if (reply === undefined) {
      throw new Error("No fake reply configured");
    }
    if (reply instanceof Error) {
      throw reply;
    }
    return reply;
  }
}

/**
 * Creates a JSON response for a fake fetch.
 */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
