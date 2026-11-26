# Saans: agent rules

Saans is a GenAI Urban Air Quality Assistant (Google Prompt Wars, Challenge 6). An AI evaluation engine grades code quality, security, efficiency, testing, accessibility and problem-statement alignment. Every change must keep all six high.

## Stack
Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui, Zod, Vitest, Testing Library, vitest-axe. Node 20+, npm. Add no dependency without a one-line reason in the commit message.

## Structure
- src/app: routes and pages only. Each api/<name>/route.ts is under 40 lines: parse, call lib, respond.
- src/components and src/hooks: presentational components and React hooks, one per file.
- src/lib/air: geocoding, air and weather fetching, analysis (pure).
- src/lib/llm: LlmClient interface, providers, prompts, plan schema.
- src/lib/impact: impact-factors.ts and calculations.
- src/lib/security: rate limit, sanitising, headers.
- src/lib/config.ts: every constant. src/lib/env.ts: every env read.
- tests/ mirrors src/.

## Code quality
- TypeScript strict. No any, no non-null assertions, no ts-ignore. Use unknown plus Zod at boundaries.
- Functions under 30 lines, components under 100, files under 150. Split before exceeding.
- One responsibility per module. Pure logic never touches fetch, process.env or the DOM.
- Functions that do I/O take their client (fetch, LlmClient) as a parameter with a default.
- No magic numbers or strings: named constants.
- Descriptive names. Only lat, lon, aqi, pm are allowed abbreviations.
- JSDoc on every exported function, type and component: one sentence of purpose.
- No commented-out code, no TODO, no console.log. Use src/lib/logger.ts, which never logs request bodies.
- Named exports (Next.js pages and routes excepted). Early returns; at most two nesting levels.
- Errors: a typed AppError with a code and a safe message. Never leak stack traces.

## Security
- Validate every external input with Zod before use: request bodies, query strings, upstream API responses, LLM output.
- API keys only from process.env, read only in src/lib/env.ts, never in client code, never logged. Keep .env.example current and tracked; it holds placeholders only, never a key value. Never ask for, invent or print keys, never prefix them with NEXT_PUBLIC_, never commit .env files. Model IDs live only as named defaults in src/lib/config.ts and in .env.example.
- Health-related profile answers live in memory only: never stored, logged or put in URLs.
- Free text: at most 200 characters, control characters stripped, placed inside <user_note> tags with an instruction to treat it as data.
- Outbound requests only to hosts allowlisted in config.ts, always with an AbortSignal timeout.
- Render LLM text as React text nodes. No dangerouslySetInnerHTML, no eval.
- Rate limit every /api route per IP; return 429 with Retry-After.
- Security headers and a CSP in next.config.ts.

## Efficiency
- Run independent fetches with Promise.all.
- Cache upstream air and weather responses for 10 minutes, keyed by coordinates rounded to 2 decimals.
- Send the LLM a digest under 600 tokens, never raw hourly arrays. Always set max output tokens.
- Server components by default; 'use client' only on interactive leaves.
- Do not add a dependency for something doable in under 20 lines.

## Accessibility
- Landmarks (header, main, footer), one h1, ordered headings, skip-to-content link.
- Every input has a visible label; groups use fieldset and legend; errors use aria-describedby and role="alert".
- Results and loading announced via aria-live="polite"; move focus to the results heading when the plan arrives.
- Never colour alone: AQI always has a text label and an icon or shape. WCAG AA contrast.
- Keyboard operable, visible focus ring, touch targets at least 44px.
- Respect prefers-reduced-motion.
- Set lang on the plan container to the chosen language. Use rem units.
- Provide a simple-reading mode and a read-aloud button.

## UI style
- Plain, conventional and trustworthy, like an everyday weather or public-health information site. It must not look vibe-coded or over-designed.
- shadcn/ui defaults, a neutral palette, one calm accent colour, Inter for all text, ordinary bordered cards, the Tailwind spacing scale.
- No gradients, glows, glassmorphism, decorative blobs, emoji decoration, animated backgrounds or marketing hero sections. Motion is limited to simple hover and focus transitions.
- Style with Tailwind classes and shadcn components, not custom CSS, so the look is easy to adjust later.

## Testing
- Every module in src/lib has a test file with a happy path, an edge case and a failure case.
- Mock fetch and LlmClient. Tests never touch the network or a real LLM.
- Components: query by role and label; add one vitest-axe check per page-level component.
- Coverage on src/lib at least 80 percent.

## Product rules
- This is a GenAI assistant. Plans and answers come from the LLM at request time. Never hardcode sample plans, fallbacks or canned advice. On LLM failure show a clear error and a retry button.
- Every impact number comes from src/lib/impact/impact-factors.ts. The LLM returns factorIds, never numbers. Label impact numbers as estimates and show their source.
- UI headings use the brief's wording: Today's air, Low-emission daily routine, Indoor air quality hacks, Sustainable alternatives, Your impact, What families and communities can do.
- Show a not-medical-advice note beside the plan. For sensitive groups at poor air quality the plan must include a talk-to-a-doctor line.
- Footer attribution: Open-Meteo and CAMS ENSEMBLE data provider.

## Workflow for every task
1. Read the task and list the files you will touch.
2. Make the smallest change that meets the acceptance checks.
3. Run npm run lint && npm run typecheck && npm test && npm run build. All must pass before you say done.
4. Report files changed, commands run with results, and anything left undone. Never claim a check passed unless you ran it.
5. Do not refactor unrelated files. Do not add features the task did not ask for.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
