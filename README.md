# Saans

Saans is a GenAI urban air-quality assistant built for **Google Prompt Wars, Challenge 6**. It checks today's air where you live, then generates a household plan for smog and everyday air pollution: a low-emission daily routine, indoor air-quality hacks, sustainable alternatives, community actions and a clear estimate of what each choice changes.

The plan is written by a language model at request time from live air data and the answers you give. There are no canned plans or fallback advice in the application code.

- **Live demo:** <https://saans-orpin.vercel.app>
- **Repository:** <https://github.com/ogMaverick12/saans>

The hosted demo uses the same code as this repository. The LLM-backed plan and Ask Saans flows require an LLM provider key (`GEMINI_API_KEY`, or `OPENROUTER_API_KEY` with `OPENROUTER_MODEL`) to be configured in Vercel; see [Deployment on Vercel](#deployment-on-vercel).

## Contents

- [What Saans does](#what-saans-does)
- [Problem-statement traceability](#problem-statement-traceability)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [How the AI is used](#how-the-ai-is-used)
- [Impact model and its limits](#impact-model-and-its-limits)
- [Data sources and attribution](#data-sources-and-attribution)
- [Security measures](#security-measures)
- [Accessibility statement](#accessibility-statement)
- [Performance](#performance)
- [Testing and quality](#testing-and-quality)
- [Setup](#setup)
- [Deployment on Vercel](#deployment-on-vercel)
- [Limitations and future work](#limitations-and-future-work)
- [Attribution](#attribution)
- [Licence](#licence)

## What Saans does

1. **Find your air.** Search for a city or use your location. Saans reads Open-Meteo air quality and weather data for those coordinates and shows **Today's air**: current PM2.5, US AQI, a plain-language category, the CPCB category for Indian locations, the cleanest and worst three-hour windows, a six-hour trend and smog cues.
2. **Describe your household.** Choose household members, how you travel, your home type, whether you have a purifier or air conditioner, cooking fuel, heating, budget, plan language and reading mode. The optional note is limited to 200 characters.
3. **Get a plan.** The live air card is headed **Today's air**. After you submit the household questions, the model's air summary and plan sections render under **Your plan**, **Low-emission daily routine**, **Indoor air quality hacks** and **Sustainable alternatives**, followed by **Your impact** and **What families and communities can do**.
4. **See the impact.** The model chooses impact factors by ID; the code looks up the numbers. Each impact is labelled as an estimate with its source.
5. **Try what-if choices.** Select or clear exposure measures and see the estimated change in daily PM2.5 exposure; the plan's avoided trip emissions are listed beside the estimate.
6. **Ask a follow-up.** Ask Saans answers one question about the current plan, in the chosen language, with the plan and a fresh air digest for the same place as context. It keeps the last five question-and-answer pairs in memory and offers up to three suggested follow-ups per answer.
7. **Use it your way.** Print the plan or save it as a PDF, read the headline, daily routine and indoor hacks aloud where the browser supports speech synthesis, or choose simple reading mode when you request the plan. Generated plan text is available in English, Hindi and Bengali; the interface labels remain in English.

Saans is not medical advice. A not-medical-advice note sits beside the plan, and the prompt requires a talk-to-a-doctor line for sensitive groups at poor air quality.

### Household profile inputs

| Question                                                    | Choices                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| Household members (checkboxes, at most five, no duplicates) | Young children, older adults, pregnancy, lung condition, heart condition |
| Usual travel                                                | Walking, cycling, two-wheeler, car, bus, metro or train, work from home  |
| Home type                                                   | Apartment, independent house, shared room                                |
| Purifier and air conditioner                                | Yes or no for each                                                       |
| Cooking fuel                                                | LPG cylinder, piped gas, electric induction, biomass or wood, other      |
| Heating                                                     | None, electric heater, gas heater, wood or coal                          |
| Budget                                                      | Low, medium, high                                                        |
| Plan language                                               | English, हिन्दी (Hindi), বাংলা (Bengali)                                  |
| Reading mode                                                | Standard, simple                                                         |
| Optional note                                               | Up to 200 characters                                                     |

### Air categories

- **US AQI:** Good 0–50, Moderate 51–100, Unhealthy for Sensitive Groups 101–150, Unhealthy 151–200, Very Unhealthy 201–300, Hazardous 301 and above.
- **CPCB PM2.5 (India, µg/m³):** Good up to 30, Satisfactory above 30 to 60, Moderate above 60 to 90, Poor above 90 to 120, Very Poor above 120 to 250, Severe above 250.

## Problem-statement traceability

The brief: _a GenAI assistant that helps families and communities navigate severe winter smog and urban air pollution by suggesting low-emission daily routines, indoor air quality hacks and sustainable alternatives tailored to their location and lifestyle, and clearly explaining the direct impact of their choices._

| Brief phrase                                          | Feature in Saans                                                                                                                                   | Main files                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GenAI assistant                                       | The plan and follow-up answers are generated by an LLM at request time; failures show a safe error and a retry button, never a fake plan           | `src/lib/llm/plan.ts`, `src/lib/llm/prompts.ts`, `src/app/api/plan/route.ts`, `src/app/api/ask/route.ts`                                |
| Helps families and communities                        | Household profile (children, older adults, pregnancy, lung and heart conditions) and a community-actions section                                   | `src/lib/profile/schema.ts`, `src/components/profile-form.tsx`, `src/components/plan/community-actions.tsx`                             |
| Navigate severe winter smog and urban air pollution   | Live PM2.5 and US AQI analysis, CPCB category for India, cleanest and worst forecast windows, six-hour trend, smog cues and a sensitive-group note | `src/lib/air/analyze.ts`, `src/lib/air/hourly.ts`, `src/components/air-card.tsx`                                                        |
| Low-emission daily routines                           | Time-ordered routine from early morning to night, with low-emission commute and timing factors                                                     | `src/components/plan/daily-routine.tsx`, `src/lib/impact/impact-lifestyle-factors.ts`                                                   |
| Indoor air quality hacks                              | Indoor hacks with cost and effort, plus an exposure simulator                                                                                      | `src/components/plan/indoor-hacks.tsx`, `src/components/what-if-panel.tsx`                                                              |
| Sustainable alternatives                              | Alternatives for commute, cooking, heating, waste and energy, each with a community benefit                                                        | `src/components/plan/sustainable-alternatives.tsx`                                                                                      |
| Tailored to their location                            | Geocoded place coordinates drive the air and weather request; the digest is passed to the model                                                    | `src/lib/air/clients.ts`, `src/lib/air/get-digest.ts`                                                                                   |
| Tailored to their lifestyle                           | Profile answers shape the prompt: household, commute, home, purifier/AC, cooking fuel, heating, budget, language and reading mode                  | `src/lib/profile/form.ts`, `src/lib/llm/prompts.ts`                                                                                     |
| Clearly explaining the direct impact of their choices | A 14-factor impact catalog, an exposure estimate, trip-emission estimates, impact badges and the what-if panel                                     | `src/lib/impact/impact-factors.ts`, `src/lib/impact/estimate.ts`, `src/components/impact-badge.tsx`, `src/components/what-if-panel.tsx` |

## Tech stack

| Layer      | Choice                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16.4.6, App Router, Turbopack, Cache Components and Partial Prefetching             |
| Language   | TypeScript 5 in strict mode, with `noUncheckedIndexedAccess` and `noImplicitOverride`       |
| UI         | React 19.3, Tailwind CSS 4.3, shadcn/ui primitives, Radix UI, lucide-react, Inter           |
| Validation | Zod 4.6 at every external boundary, including LLM output                                    |
| AI         | Google Gemini API; optional OpenRouter fallback                                             |
| Data       | Open-Meteo geocoding, air quality and weather APIs; CAMS ENSEMBLE air-quality data          |
| Tests      | Vitest 4, Testing Library, `@testing-library/user-event`, vitest-axe, jsdom, v8 coverage    |
| Hosting    | Vercel, with Next.js serverless functions and a 60-second route limit                       |
| CI         | GitHub Actions on Node 20: lint, typecheck, coverage, build and production dependency audit |

## Architecture

### Request flow

1. The browser loads `/`. `src/app/layout.tsx` renders the header, skip link, main landmark, footer attribution and Inter font; `src/app/page.tsx` renders the client shell `SaansApp`.
2. A place search calls `GET /api/geocode?q=…`. The route rate-limits the request, validates the query with Zod, then calls Open-Meteo geocoding through the allowlisted HTTPS fetch wrapper. The browser debounces typing by 300 ms and aborts stale searches.
3. Selecting a place calls `GET /api/air?lat=…&lon=…&name=…`. `getAirDigest` fetches air quality and weather in parallel, rounds coordinates to two decimals, caches upstream responses for ten minutes and analyses the hourly series into a small digest.
4. Submitting the profile calls `POST /api/plan`. The guard rate-limits and validates the body, rebuilds the digest, creates the ordered LLM client and calls `generatePlan`.
5. `generatePlan` builds a prompt containing the digest, profile and factor catalog, requests strict JSON, validates it with Zod, retries once with a validation summary, then replaces factor IDs with catalog factors.
6. The UI renders the plan, impact badges, what-if panel, print and read-aloud tools. For `POST /api/ask`, the browser converts the plan's attached factors back to IDs, then the route answers the question with a fresh digest for the same place and the plan, validated against the ask schema.
7. `GET /api/health` reports whether each LLM client is configured; `?probe=1` makes one tiny live call per configured client and caches the result for 60 seconds.
8. Air and plan failures render a safe message and a retry button. The retry repeats the last request. There is no canned plan.

### Data flow

```text
Browser
  ├─ GET  /api/geocode ──> Open-Meteo Geocoding
  ├─ GET  /api/air ──────> Open-Meteo Air Quality + Weather (parallel, 10-minute cache)
  ├─ POST /api/plan ─────> Gemini primary → Gemini fallback → OpenRouter (optional)
  ├─ POST /api/ask ──────> same ordered client chain
  └─ GET  /api/health ───> configuration report, optional live probes
```

### Main folders

```text
src/
  app/                 Next.js App Router
    api/               geocode, air, plan, ask, health routes
    globals.css        Tailwind, theme tokens, print and reduced-motion rules
    layout.tsx         landmarks, skip link, attribution
    page.tsx           home page
  components/          presentational components, one per file
    plan/              five plan sections, safety note and plan tools
    profile/           profile fieldsets and error summary
    ui/                shadcn/ui primitives
  hooks/               client state, search, geolocation and plan flow
  lib/
    air/               upstream clients, schemas, hourly analysis, formatting
    api/               guards, request schemas, browser client, health
    impact/            factor catalog, exposure and trip estimates
    llm/               providers, prompts, schema, generation, display
    profile/           profile schema, options and form mapping
    security/          allowlist, headers, rate limit, sanitising
    abort.ts           shared abort detection
    config.ts          every constant and env read
    errors.ts          typed AppError with safe messages
    logger.ts          logger that never records request bodies
    place-search.ts    search status and announcements
    plan-flow.ts       pure air-and-plan state reducer
    utils.ts           className helper
    zod-config.ts      disables Zod's eval-based JIT for the strict CSP
tests/                 mirrors src/
  api/ app/ components/ fixtures/ hooks/ lib/
```

### API routes

| Method | Route                               | Input                                          | Returns                    | Cache                  |
| ------ | ----------------------------------- | ---------------------------------------------- | -------------------------- | ---------------------- |
| `GET`  | `/api/geocode?q=`                   | `q` 2–80 characters                            | Up to five matching places | `private, max-age=300` |
| `GET`  | `/api/air?lat=&lon=&name=&country=` | Latitude, longitude, optional name and country | Air digest                 | `private, max-age=300` |
| `POST` | `/api/plan`                         | `{ place, profile, language, readingMode }`    | `{ plan, digest }`         | `no-store`             |
| `POST` | `/api/ask`                          | `{ place, question, plan, language }`          | `{ answer, followUps }`    | `no-store`             |
| `GET`  | `/api/health?probe=1`               | Optional probe flag                            | LLM client statuses        | `no-store`             |

Every route uses `withApiGuard`, which applies the shared per-IP rate limiter, reads the query string or JSON body, validates it with Zod, calls the handler and wraps the result in a stable envelope:

```json
{ "ok": true, "data": {} }
```

```json
{ "ok": false, "error": { "code": "VALIDATION_FAILED", "message": "…" } }
```

| Code                 | HTTP status | Meaning                                                |
| -------------------- | ----------- | ------------------------------------------------------ |
| `VALIDATION_FAILED`  | 400         | The request body or query string is invalid            |
| `RATE_LIMITED`       | 429         | The per-IP limit was exceeded; `Retry-After` is set    |
| `UPSTREAM_BLOCKED`   | 502         | An outbound URL was not HTTPS or not allowlisted       |
| `UPSTREAM_TIMEOUT`   | 502         | An air, weather or geocoding call timed out            |
| `UPSTREAM_FAILED`    | 502         | An upstream service failed or returned an invalid body |
| `LLM_NOT_CONFIGURED` | 503         | No Gemini or OpenRouter credentials are set            |
| `LLM_UNAVAILABLE`    | 503         | Every configured provider failed or timed out          |
| `LLM_BAD_OUTPUT`     | 502         | The model returned invalid JSON twice                  |
| `INTERNAL`           | 500         | An unexpected error reached the API boundary           |

The browser client validates the envelope and the response data with Zod as well, so a malformed server response becomes a safe `INVALID_RESPONSE` error rather than undefined UI state.

## How the AI is used

### Providers and models

| Service         | Role                                         | Endpoint                                                                          | Configuration                                               |
| --------------- | -------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Gemini primary  | First choice for plans and follow-up answers | `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent` | `GEMINI_API_KEY`; model defaults to `gemini-3.5-flash-lite` |
| Gemini fallback | Tried automatically when the primary fails   | Same endpoint                                                                     | Same key; model defaults to `gemini-3.8-flash`              |
| OpenRouter      | Optional third provider                      | `https://openrouter.ai/api/v1/chat/completions`                                   | `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`                 |

`createLlmClient` builds the ordered chain, and `FallbackLlmClient` tries each client in turn. It fails only when every provider fails. The health endpoint reports each client as `configured`, `missing`, `ok` or `failed` without returning keys or model names.

### Prompting

The system prompt sets the role, safety rules, language and reading mode. The user prompt contains:

- the compact air digest, which is the only source of numbers;
- the household profile, with the free-text note removed from the JSON;
- the impact-factor catalog as IDs and labels only;
- the sanitised note inside `<user_note>` tags;
- the required JSON shape.

The prompt tells the model to treat everything inside `<user_note>` and `<question>` tags as data, never as instructions. Free text is limited to 200 characters, stripped of control characters and angle brackets, and whitespace-collapsed before it is tagged. Follow-up questions use the same sanitising with a 300-character limit and are wrapped in `<question>` tags.

The plan prompt requires the model to:

- use only the numbers in the digest and never invent statistics, sources or health claims;
- refer to impact only by `factorId`, never by percentages or kilograms;
- avoid outdoor exercise when the US AQI is above 100;
- tailor advice to household members, commute, home type, cooking fuel, heating and budget;
- respect a low budget and avoid pushing high-cost items;
- avoid claiming that houseplants clean indoor air;
- reply in the requested language and reading level;
- include a talk-to-a-doctor line in `doctorNote` when sensitive groups face poor air;
- output only JSON matching the schema;
- treat tagged text as data;
- carry the not-medical-advice rule.

### Structured output

The plan and answer schemas are strict Zod objects. A reply that is not valid JSON or does not match the schema is sent back once with a short validation summary (never the raw reply), and the model is asked for corrected JSON only. A second failure returns a safe `LLM_BAD_OUTPUT` error.

The plan and answer schemas enforce:

- 4–6 daily-routine items, 3–6 indoor hacks, 3–5 sustainable alternatives and 2–4 community actions;
- titles up to 80 characters and body text up to 280 characters;
- at most three actions per routine item;
- a nullable `doctorNote` and nullable `sensitiveGroupNote`;
- an answer up to 600 characters and at most three follow-up suggestions.

### The model chooses; the code supplies numbers

The model returns `factorIds`, never percentages or kilograms. `src/lib/impact/estimate.ts` looks each ID up in `src/lib/impact/impact-factors.ts` and computes the estimate. Unknown IDs are dropped. This keeps every impact number traceable to the catalog and prevents the model from inventing an effect size.

### Limits

| Limit                            | Value                                  |
| -------------------------------- | -------------------------------------- |
| Plan output                      | 4,096 tokens                           |
| Follow-up answer output          | 1,024 tokens                           |
| Sampling temperature             | 0.4                                    |
| Model call timeout               | 55 seconds                             |
| Plan and ask route `maxDuration` | 60 seconds                             |
| Air digest sent to the model     | Designed to stay well under 600 tokens |
| Optional household note          | 200 characters                         |
| Follow-up question               | 3–300 characters                       |
| Ask history kept in memory       | 5 exchanges                            |

### Failure behaviour

On any LLM failure the UI shows a clear error and a retry button. It does not substitute a sample plan or canned advice. Missing credentials return `LLM_NOT_CONFIGURED`; provider failures and timeouts return `LLM_UNAVAILABLE`; invalid JSON twice returns `LLM_BAD_OUTPUT`.

## Impact model and its limits

The catalog has 14 factors: nine exposure factors and five lifestyle factors. Every factor has an ID, a label, a group, a scope, an effect, a source string and a confidence level.

| ID                       | Factor                                      | Scope   | Effect                                     |
| ------------------------ | ------------------------------------------- | ------- | ------------------------------------------ |
| `n95-mask`               | Well-fitted N95 or FFP2 mask                | Outdoor | 50% low / 80% typical / 95% high reduction |
| `surgical-mask`          | Surgical mask                               | Outdoor | 5 / 20 / 35% reduction                     |
| `cloth-mask`             | Cloth mask                                  | Outdoor | 0 / 10 / 25% reduction                     |
| `hepa-purifier`          | HEPA air purifier                           | Indoor  | 40 / 60 / 80% reduction                    |
| `diy-box-fan-filter`     | Box-fan filter                              | Indoor  | 30 / 50 / 70% reduction                    |
| `seal-windows-at-peak`   | Keep windows closed at peak pollution       | Indoor  | 20 / 40 / 60% reduction                    |
| `cooking-exhaust`        | Exhaust fan while cooking                   | Indoor  | 20 / 40 / 60% reduction                    |
| `clean-cooking-fuel`     | Clean cooking fuel                          | Indoor  | 40 / 60 / 90% reduction                    |
| `shift-outdoor-activity` | Move outdoor activity to the cleanest hours | Outdoor | Computed from the cleanest forecast window |
| `walk-or-cycle`          | Walk or cycle instead of driving            | Trip    | 1.7 kg CO2e avoided per 10 km trip         |
| `metro-or-bus`           | Use public transport                        | Trip    | 1.2 kg CO2e avoided per 10 km trip         |
| `carpool`                | Share a car trip                            | Trip    | 0.85 kg CO2e avoided per 10 km trip        |
| `avoid-open-burning`     | Avoid burning waste or leaves               | Outdoor | Qualitative                                |
| `wet-mop-dust`           | Wet-mop floors                              | Indoor  | Qualitative                                |

### Exposure estimate

The baseline combines the daily mean PM2.5 with the hours typically spent outdoors for the chosen commute and an indoor infiltration factor of 0.7. Outdoor hours are 2 for walking or cycling, 1.5 for a two-wheeler, bus or metro, 1 for a car and 0.5 for working from home.

The adjusted estimate applies the strongest selected mask to the outdoor portion and the strongest selected factor in each indoor group (cleaner, ventilation and cooking) to the indoor portion. Factors in the same group count once. The timing factor replaces the outdoor PM2.5 value with the mean of today's cleanest three-hour window. Results are rounded to one decimal place and shown as a baseline and adjusted bar.

### Trip emissions

Walking or cycling, public transport and carpooling show avoided kg CO2e per 10 km trip compared with driving alone. The catalog source notes that the values are typical per-passenger emission factors and vary by vehicle.

### What-if panel

The panel starts with the exposure factors the plan already recommends. It offers five switch groups: masks, air cleaners, ventilation, cooking and timing. Toggling a choice recalculates the exposure estimate in the browser using the same catalog and shows a polite announcement after a 400 ms debounce. Trip factors attached to the plan are listed separately. The panel shows an overall caveat rather than a per-factor source.

### Limits

Every impact number is an **estimate**, not a measurement. The ranges are approximate round numbers based on public-health and vehicle-emission guidance, and each factor in the plan shows its source. The model does not model dispersion, building air exchange, activity level, age or health status. The what-if panel is a planning aid, not a prediction. It is not a substitute for a local air-quality monitor or medical advice.

## Data sources and attribution

| Service                    | Used for                                                            | Where                                                                   |
| -------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Open-Meteo Geocoding API   | City search and coordinates                                         | `https://geocoding-api.open-meteo.com` via `src/lib/air/clients.ts`     |
| Open-Meteo Air Quality API | Current PM2.5, US AQI and two days of hourly values                 | `https://air-quality-api.open-meteo.com` via `src/lib/air/clients.ts`   |
| Open-Meteo Forecast API    | Current temperature, humidity and wind for the digest and smog cues | `https://api.open-meteo.com` via `src/lib/air/clients.ts`               |
| Google Gemini API          | Plan generation and follow-up answers (primary and fallback models) | `https://generativelanguage.googleapis.com` via `src/lib/llm/gemini.ts` |
| OpenRouter                 | Optional fallback LLM provider                                      | `https://openrouter.ai` via `src/lib/llm/openrouter.ts`                 |
| Vercel                     | Hosting and serverless functions                                    | Deployment only; no SDK in the code                                     |

Only the five upstream API hosts above are allowlisted in `src/lib/config.ts`. Every outbound request uses HTTPS, an `AbortSignal` timeout and the shared safe-fetch wrapper. Air and weather calls use a 5-second timeout; LLM calls use 55 seconds.

The air-quality request asks for current `us_aqi`, `pm2_5` and `pm10`, plus hourly `pm2_5` and `us_aqi` for two forecast days in the location's timezone. The weather request asks for current `temperature_2m`, `relative_humidity_2m` and `wind_speed_10m`.

The digest contains the current PM2.5, US AQI, US category, optional CPCB category, daily mean PM2.5, six-hour trend, cleanest and worst three-hour windows, weather snapshot and smog cues. The CPCB category appears when the country is India, or when the country is unknown and the air-quality timezone is `Asia/Kolkata`. Smog cues appear when wind is below 5 km/h, humidity is above 70%, or temperature is below 12°C. The trend compares the next six hours with the current hour using a 15% band.

## Security measures

- **Validation at every boundary.** Request bodies and query strings, upstream API responses, LLM output and browser responses are parsed with Zod. Invalid input gets a safe `VALIDATION_FAILED` response.
- **Secrets.** API keys are read only in `src/lib/config.ts` from `process.env`, never exposed to client code, never logged and never committed. `.env.example` holds placeholders only. No key is prefixed with `NEXT_PUBLIC_`.
- **Health data stays in memory.** Profile answers are held in React state and sent in the request body. They are not stored in a database, not written to logs and not put in URLs.
- **Free text.** The optional note is capped at 200 characters in the browser with a live counter and tells users not to include names, addresses or medical details. On the server, control characters and angle brackets are stripped, whitespace is collapsed, and the note is placed inside `<user_note>` tags with an instruction to treat it as data. Follow-up questions use the same treatment with a 300-character limit and `<question>` tags.
- **Outbound requests.** Host allowlist, HTTPS only and an `AbortSignal` timeout on every call.
- **Rate limiting.** Every `/api` route allows 20 requests per IP per minute and returns `429` with `Retry-After`. The limiter is an in-memory sliding window with a 5,000-key cap. It resets per serverless instance, so it blocks bursts but is not a shared quota.
- **Headers.** A CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(), microphone=()` and `poweredByHeader: false`. Vercel also serves HSTS in production.
- **CSP and Zod.** The production CSP is:

  ```text
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self';
  font-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
  ```

  Inline scripts and styles are required because Next.js streams hydration data and styles. Production does **not** include `'unsafe-eval'`. Development adds it for Next.js tooling. The client entry imports `src/lib/zod-config.ts` before any schema is built, which disables Zod's eval-based JIT with `z.config({ jitless: true })`, so the strict CSP never reports a blocked eval probe.

- **Rendering.** LLM text is rendered as React text nodes. There is no `dangerouslySetInnerHTML` and no `eval`.
- **Errors.** A typed `AppError` carries a stable code and a safe message. Stack traces and upstream details are never sent to the browser.
- **Logging.** `src/lib/logger.ts` writes JSON lines with primitive-only context. It never records request bodies, profile answers, free text or secrets.
- **Health endpoint.** `/api/health` reports status values and safe error codes only. It never returns API keys or model names.

## Accessibility statement

Saans aims to meet WCAG 2.2 AA.

- The layout has a header, one main landmark, a footer and a skip-to-content link. Each page has one `h1` and headings in order.
- Every input has a visible label. Groups use `fieldset` and `legend`. The form-level error summary uses `role="alert"`, moves focus to itself and links to each invalid field. Inline errors are connected with `aria-describedby`.
- The place search is a labelled combobox with `aria-activedescendant` and `aria-autocomplete="list"`. Arrow keys move through results, Enter selects, Escape closes, and the result count is announced politely. The **Use my location** button requests a one-shot position only when clicked; permission, timeout and unavailable errors use `role="alert"` and suggest searching for a city.
- Results and loading states are announced with `aria-live="polite"`. When a plan arrives, focus moves to its heading, including when the lazily loaded plan chunk finishes.
- AQI is never shown by colour alone: every level has a text label and a distinct icon, and colours target AA contrast.
- The interface is keyboard operable with a visible focus ring, and primary controls use touch targets of at least 44px.
- Motion respects `prefers-reduced-motion`. Type is sized in `rem`.
- The plan and Ask Saans containers carry the chosen language, so screen readers switch voice. Simple reading mode asks the model for sentences under 12 words and everyday words. The read-aloud button speaks the headline, daily routine and indoor hacks using `en-IN`, `hi-IN` or `bn-IN` when the browser supports speech synthesis. The print button opens the browser print dialog and hides non-print controls.
- The layout, home page, air card, ask box, location search, plan view, profile form, SaansApp shell and what-if panel have automated vitest-axe checks.

## Performance

Production Lighthouse scores on stable runs:

| Category       | Mobile | Desktop |
| -------------- | -----: | ------: |
| Performance    |    100 |     100 |
| Accessibility  |    100 |     100 |
| Best practices |    100 |     100 |
| SEO            |    100 |     100 |

A cold first mobile run can score lower while the stylesheet and font caches warm; repeated runs settle at 100. The local production build scores 99 performance on mobile and 100 on desktop.

The main optimisations:

- **Server components by default.** `"use client"` is limited to interactive leaves such as the search, profile form, plan view and ask box.
- **Lazy below-the-fold chunks.** `ProfileForm` and `PlanResult` are loaded with `next/dynamic` and `ssr: false`, keeping the profile and plan code out of the initial bundle. Plan-heading focus lives in `PlanView` so it still fires after the lazy chunk mounts.
- **No eval in production.** Zod runs JIT-less, so the strict CSP does not need `'unsafe-eval'`.
- **Caching.** Air and weather responses are cached for 10 minutes, keyed by coordinates rounded to two decimals. The geocode and air API responses are private for 5 minutes.
- **Parallel fetches.** Air quality and weather are requested with `Promise.all`.
- **Small prompts.** The digest is compact, the plan output is capped at 4,096 tokens and the answer at 1,024.
- **Next.js 16 features.** Cache Components and Partial Prefetching are enabled in `next.config.ts`.

## Testing and quality

```bash
npm test
npm run test:coverage
npm run lint
npm run typecheck
npm run format
```

- Vitest, Testing Library, `@testing-library/user-event` and vitest-axe run in jsdom.
- Tests mirror `src/` under `tests/` and cover happy paths, edge cases and failure cases for the `src/lib` modules.
- `fetch` and the LLM client are injected and mocked. Tests never touch the network or a real model.
- Components are queried by role and label. Page-level components and the plan view include axe checks.
- The current suite has **73 test files and 427 tests**.
- Coverage is collected for `src/lib` and enforced at 80% for lines, functions, branches and statements. The current report is:

| Metric     | Coverage |
| ---------- | -------: |
| Statements |    99.6% |
| Branches   |   96.86% |
| Functions  |   99.45% |
| Lines      |   99.72% |

- TypeScript is strict, with no `any`, no non-null assertions and no `ts-ignore`.
- Prettier checks the tracked code files; Markdown, `public`, the lockfile and generated Next types are excluded by `.prettierignore`.
- CI (`.github/workflows/ci.yml`) runs on every push and pull request on Node 20: `npm ci`, lint, typecheck, coverage, build and `npm audit --omit=dev --audit-level=high`. The typecheck script runs `next typegen` before `tsc --noEmit`, so route types such as `LayoutProps<"/">` exist on a fresh checkout.

## Setup

Requirements: **Node 20 or newer** and npm.

```bash
npm ci
cp .env.example .env.local
# add your key to .env.local
npm run dev
```

On Windows PowerShell, copy the example with `Copy-Item .env.example .env.local`.

Open <http://localhost:3000>. To check the LLM configuration, open <http://localhost:3000/api/health?probe=1>.

### Environment variables

| Variable                | Required                             | Purpose                                                                          | Suggested Vercel type |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------- | --------------------- |
| `GEMINI_API_KEY`        | Yes, unless OpenRouter is configured | Gemini API key from Google AI Studio                                             | **Secret**            |
| `GEMINI_MODEL`          | No                                   | Primary Gemini model; defaults to `gemini-3.5-flash-lite` in `src/lib/config.ts` | Config                |
| `GEMINI_FALLBACK_MODEL` | No                                   | Second Gemini model tried before OpenRouter; defaults to `gemini-3.8-flash`      | Config                |
| `OPENROUTER_API_KEY`    | No                                   | Enables the OpenRouter fallback provider                                         | **Secret**            |
| `OPENROUTER_MODEL`      | Only with the OpenRouter key         | OpenRouter model ID                                                              | Config                |

`.env.example` is tracked and contains placeholders only. `.env.local` and every other `.env*` file are ignored by git. Never prefix a key with `NEXT_PUBLIC_`.

On Vercel, choose **Secret** for API keys. Config and Secret values are both available at runtime, but Config values can be read back in the dashboard; Secret values are write-only. Model IDs are not sensitive and can stay Config. Environment changes apply only to new deployments, so redeploy after adding or changing a variable.

### Scripts

| Command                 | What it does                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| `npm run dev`           | Start the development server                                           |
| `npm run build`         | Production build                                                       |
| `npm start`             | Serve the production build                                             |
| `npm run lint`          | ESLint                                                                 |
| `npm run typecheck`     | Generate Next route types with `next typegen`, then run `tsc --noEmit` |
| `npm test`              | Vitest once                                                            |
| `npm run test:coverage` | Vitest with v8 coverage and the 80% thresholds                         |
| `npm run format`        | Prettier check                                                         |

## Deployment on Vercel

The production deployment is <https://saans-orpin.vercel.app>, connected to the `master` branch of <https://github.com/ogMaverick12/saans>.

1. Push the repository to GitHub and import it in Vercel as a Next.js project.
2. Add `GEMINI_API_KEY` in **Project → Settings → Environment Variables**, choose **Secret**, and select **Production** (and Preview if you want). Add `OPENROUTER_API_KEY` as Secret and `OPENROUTER_MODEL` as Config only if you want the fallback provider. The Gemini model names are optional; the defaults are in `src/lib/config.ts`. `OPENROUTER_MODEL` is required when `OPENROUTER_API_KEY` is set.
3. Never commit `.env.local` or paste a key into the repository. Environment variables belong in the Vercel dashboard.
4. Redeploy after saving environment variables. Existing deployments keep their previous values.
5. Open `/api/health?probe=1` on the deployed URL. Gemini should report `ok`.

A healthy probe looks like:

```json
{
  "ok": true,
  "data": {
    "clients": {
      "gemini-primary": { "status": "ok" },
      "gemini-fallback": { "status": "ok" },
      "openrouter": { "status": "missing" }
    },
    "probed": true
  }
}
```

The plan and ask routes allow up to 60 seconds (`maxDuration = 60`). The in-memory rate limiter resets when a serverless instance is replaced. That is acceptable for burst protection but not for a shared production quota; a Redis or Upstash-backed limiter is the future fix.

## Limitations and future work

- **LLM free tiers can be slow or rate-limited during grading.** The second Gemini model and the optional OpenRouter provider exist for this. Without any configured provider the app shows a clear error instead of a plan.
- **The rate limiter is per instance.** A shared store would make limits consistent across serverless instances.
- **Impact factors are approximate.** They are round planning numbers, not measurements or a dispersion model. A future version could use local monitor data and a validated exposure model.
- **Air data is model-based.** Open-Meteo and CAMS ENSEMBLE provide forecast and reanalysis data, not a sensor on your street.
- **No accounts or saved plans.** Health-related profile answers stay in memory by design. Persistence would need a privacy review.
- **Ask history is in memory.** The last five exchanges disappear on refresh.
- **Read-aloud depends on the browser.** The button is hidden when speech synthesis is unavailable, and it speaks only the headline, routine and indoor hacks.
- **Languages.** Generated plan text supports English, Hindi and Bengali. The interface labels are English. More languages need prompt and UI review, not just a new label.
- **No push alerts or notifications.** Saans is a check-today tool, not a monitoring service.
- **The what-if panel is a planning aid.** It is not a prediction or a substitute for a local monitor.

## Attribution

Weather and air data by [Open-Meteo.com](https://open-meteo.com/). Air quality data from the [CAMS ENSEMBLE](https://atmosphere.copernicus.eu/) data provider. Plan and answer text is generated by Google Gemini, with an optional OpenRouter fallback. This attribution is also shown in the site footer.

## Licence

[MIT](LICENSE).
