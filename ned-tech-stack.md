# Ned — Recommended Technology Stack

*For an AI "mate" with a conversational layer, a proactive nudge engine, a household mental-load dashboard, and memory that learns each household over time.*

---

## The shape of the problem

Ned isn't a CRUD task app with a chatbot bolted on. Three things make it architecturally distinct, and the stack has to serve all three:

1. **A conversational agent with a strong, protected voice** — warm roast, never shame. Tone is a product requirement, not a nicety, so it needs guardrails in the pipeline.
2. **Proactive intelligence** — Ned acts unprompted ("it's been 9 days since the shop, mate"). That means a background engine constantly watching household state and deciding *when* and *whether* to speak — not just responding to taps.
3. **Earned memory** — Ned gets smarter about a specific household over time, learning patterns through the dad. That's a structured-state + semantic-memory problem, not a stateless LLM call.

It also holds **highly sensitive data** — children's ages and health, family relationship dynamics, household routines. Privacy and compliance (UK/EU GDPR, given the UK and Spain framing) are first-class, not an afterthought.

The recommendation below favours a lean, managed, mostly-TypeScript stack you can ship fast with a small team, while keeping the AI layer swappable.

---

## Stack at a glance

| Layer | Recommendation | Why |
|---|---|---|
| **Mobile app** | React Native + Expo, TypeScript | One codebase for iOS/Android, OTA updates, fast iteration. The product *is* mobile-first ("texting a mate"). |
| **State / data fetching** | TanStack Query + Zustand | Server-cache + light local state; no Redux ceremony. |
| **Backend API** | Node.js + NestJS (TypeScript) | Shared types with the app; structured, testable. Swap-in Python AI service if needed. |
| **Database** | PostgreSQL (via Supabase or Neon) | Relational fits households → kids → categories → tasks cleanly. |
| **Vector / semantic memory** | pgvector (inside Postgres) | Ned's "earned intelligence" without a second datastore early on. |
| **Cache / queues** | Redis (Upstash or managed) | Rate limiting, caching, and the job queue for nudges. |
| **Background jobs** | BullMQ (early) → Temporal (as it grows) | Reminders, weekly reviews, the proactive-nudge engine. |
| **LLM** | Anthropic Claude | Strong instruction-following and tone control for the warm-roast voice; long context for household memory; native tool use. |
| **Agent orchestration** | Vercel AI SDK (TS) or LangGraph (Python) | Tool-calling, multi-step reasoning, the proactive loop. |
| **LLM observability** | Langfuse or Helicone | Trace prompts, cost, latency; run tone evals. |
| **Auth** | Clerk or Supabase Auth | Email + Apple/Google sign-in; consumer-grade. |
| **Push notifications** | Expo Notifications → APNs + FCM | The delivery channel for nudges and celebrations. |
| **Email / SMS** | Resend (email), Twilio (SMS, optional) | Re-engagement and the "why you started" moments. |
| **Product analytics** | PostHog | Behavioural funnels, feature flags, A/B — self-hostable for data control. |
| **Error / crash monitoring** | Sentry | App + backend. |
| **Repo / CI** | Turborepo monorepo + GitHub Actions + EAS | Shared code, automated builds, mobile release pipeline. |
| **Hosting** | Render / Fly.io / Railway early → AWS or GCP at scale | Managed first to keep burn low. |
| **Secrets** | Doppler or cloud secrets manager | Keep API keys out of the repo. |

---

## Client — the chat surface

**React Native + Expo + TypeScript.** The whole product premise is "it feels like texting a mate," so the chat experience has to be native-grade on both platforms without two engineering teams. Expo gives you over-the-air updates (ship copy and tone tweaks without an app-store cycle — important when voice is the product) and a managed build pipeline via EAS.

For the chat UI you can build on a library like Gifted Chat or Stream's chat SDK, or roll a custom renderer (the prototype shows the bubble system you'd implement). Use **TanStack Query** for server state and **Zustand** for the small amount of local UI state. **Flutter** is a credible alternative if you have Dart expertise, but React Native keeps you in one language end-to-end with the backend.

---

## Backend — the API and service layer

**Node.js + NestJS in TypeScript.** A structured framework keeps a growing team sane, and sharing types between app and server removes a whole class of bugs. NestJS handles the conventional surface area: onboarding, household/kid/task CRUD, the dashboard ("The Load") data, auth, and the API the agent's tools call into.

If your AI work pulls you toward the Python ecosystem (LangGraph, richer ML tooling), break the **AI agent out as a separate Python/FastAPI service** and keep the core API in TypeScript. Starting unified and extracting later is the pragmatic path.

---

## Data — Postgres is the backbone

**PostgreSQL**, accessed through **Supabase** (fastest path: Postgres + auth + storage + realtime + row-level security in one) or **Neon** (serverless Postgres) if you want to assemble pieces yourself. The domain is inherently relational — a household has parents, children, and twelve task categories, each with status, ownership, and history — so a relational core is the right call.

Two companions:

- **pgvector** in the same Postgres instance stores Ned's semantic memory — embeddings of household patterns, past conversations, and learned preferences. Keeping it in Postgres avoids running a separate vector database (Pinecone, Weaviate) until scale demands it.
- **Redis** for caching, rate limiting, and backing the job queue.

Use **Row-Level Security** so a user can only ever reach their own household's data — essential given the sensitivity.

---

## The AI layer — Ned's brain

This is the heart of the system, and it has three moving parts:

**1. The language model — Anthropic Claude.** The voice is the moat ("warm roast, never cold shame"), and that lives or dies on instruction-following and tone control. Claude is strong here, handles long context (useful for carrying household memory into a conversation), and supports native tool use. Keep the integration behind an interface so you can route routine, cheap tasks (classification, intent detection) to a smaller/faster model and reserve the top model for voice-critical generation — this is also your main cost lever.

**2. Orchestration and tools.** Use the **Vercel AI SDK** (if you stay TypeScript) or **LangGraph** (if Python) to manage tool-calling and multi-step flows. Ned's tools are functions that hit your own services: *book appointment, set reminder, build shopping list, mark task owned, log a win.* Tool use is what turns talk into action — principle 03, "noticing, not outsourcing," is enforced by *what tools exist* and how they're framed.

**3. Memory — the "earned intelligence" loop.** Layer it:
- **Structured state** in Postgres — the authoritative picture of the household and load distribution (this is also what the dashboard renders).
- **Semantic memory** in pgvector — patterns, preferences, and past context retrieved per conversation.
- **Rolling summaries** — compress history so you're not paying to resend everything each turn.

**The proactive engine** is a scheduled background process (BullMQ/Temporal jobs) that periodically evaluates household state, detects signals ("9 days since a shop," "dentist overdue 3 weeks," "half-term approaching"), and decides whether Ned should reach out. It's a **hybrid**: deterministic rules decide *that* a nudge is warranted; the LLM phrases it *in voice*. This separation keeps nudges reliable and cheap while still sounding like Ned.

**Tone guardrails.** Because a notification that "could make a dad defensive or deflated is wrong" (principle 05), run a lightweight check on outbound Ned messages — a tone classifier or a fast second-model pass that rejects/rewrites anything shaming. Trace everything with **Langfuse** or **Helicone** so you can evaluate tone quality, cost, and latency over time.

---

## Notifications, scheduling, and messaging

Nudges and celebrations are delivered via **push** (Expo Notifications fronting **APNs** and **FCM**). The timing and orchestration of reminders, daily/weekly nudges, and "why you started" re-motivation moments run on the **job scheduler** (BullMQ on Redis early; **Temporal** when workflows get complex and you want durable, retryable, multi-step flows). **Resend** covers transactional/lifecycle email; add **Twilio** only if you want SMS nudges.

---

## Auth, integrations, analytics, infra

**Auth:** **Clerk** (great mobile DX, social + Apple sign-in out of the box) or **Supabase Auth** if you're already on Supabase.

**Integrations (phase 2):** Google/Apple Calendar for appointments, and grocery/shopping services — all via OAuth, added once the core loop works.

**Analytics:** **PostHog** for behavioural funnels, feature flags, and experiments — and it can be self-hosted, which matters for sensitive data. **Sentry** for crash and error monitoring across app and backend.

**Infra & delivery:** a **Turborepo** monorepo (app + backend + shared types), **GitHub Actions** for CI, **EAS** for mobile builds and submissions. Host on **Render / Fly.io / Railway** early to minimise ops, graduating to **AWS or GCP** when scale or compliance requires it. Manage secrets with **Doppler** or your cloud's secrets manager.

---

## Privacy & security — treat this as a feature, not a checkbox

Ned holds children's ages and health notes, family relationship dynamics, and household routines. That is among the most sensitive data a consumer app can carry, and the UK/EU framing means **UK-GDPR and GDPR apply**.

- **Data minimisation** — collect only what a feature needs; the onboarding "honest baseline" is sensitive, so store it carefully and never expose it.
- **Encryption** in transit (TLS) and at rest; **Row-Level Security** so households are hard-isolated.
- **Children's data** gets extra care — lawful basis, retention limits, and parental control.
- **Right to deletion** and data export built in from day one.
- **Subprocessor DPAs** with every vendor that touches data (LLM provider, hosting, analytics) — and prefer providers that don't train on your data.
- A clear stance on what Ned's partner can/can't see — the brief makes the partner the ultimate beneficiary, but the dad is the account holder, so model that relationship deliberately.

---

## Cost & scale notes

The dominant variable cost is **LLM tokens**. Three levers keep it sane:
1. **Model routing** — small model for classification/intent, top model only for voice-critical generation.
2. **Memory compression** — rolling summaries and retrieval instead of resending full history.
3. **The rules/LLM split** in the proactive engine — let deterministic logic decide *when*, so you only spend tokens on phrasing.

Start fully managed (Supabase + Render + Upstash Redis) to keep monthly burn low and headcount focused on the product, not the platform. Re-platform onto AWS/GCP when scale, cost, or compliance makes it worth the operational weight.

---

## One-line summary

**Expo/React Native app → NestJS/TypeScript backend → PostgreSQL + pgvector + Redis → Claude-powered agent (Vercel AI SDK or LangGraph) with a rules-driven proactive engine and layered memory → push/email delivery → PostHog + Sentry + Langfuse for product and AI observability — all managed-first, privacy-by-design.**
