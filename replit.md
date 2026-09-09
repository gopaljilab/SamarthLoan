# SamarthLoan

SamarthLoan helps citizens discover suitable prototype financial schemes, understand repayment, find a channel partner, and track an application.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/schemesathi` — responsive React + Vite application and route-level UI.
- `artifacts/api-server/src/routes/schemes.ts` — in-memory prototype scheme matching, EMI, partner routing, applications, and analytics API.
- `lib/api-spec/openapi.yaml` — source-of-truth API contract; generated clients live under `lib/api-client-react` and `lib/api-zod`.

## Architecture decisions

- The first build uses clearly labeled in-memory demo data so the complete hackathon story works without requiring a real identity system or live government integrations.
- Scheme and partner ranking are deterministic weighted rules, with the scoring breakdown returned to the UI for explainability.
- The beneficiary flow is the primary product surface; admin routes are included as a prototype authority dashboard.

## Product

- Multi-step eligibility intake with Rahul Kumar and student demo presets.
- Ranked scheme recommendations with “why this match” explanations.
- Illustrative EMI calculator, partner routing, application submission, tracking, and beneficiary dashboard.
- Prototype admin analytics with charts and partner/scheme views.
- Instant English, Hindi, and Kannada UI switching.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- All scheme, partner, analytics, and calculation content is illustrative prototype data and must be verified against official guidelines.
- OpenAPI integer fields are represented as numeric fields because this workspace currently generates against Zod 3, which does not expose `z.int()`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
