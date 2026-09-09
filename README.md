# SamarthLoan

> Smart Credit & Scheme Navigator for marginalized entrepreneurs and students.

SamarthLoan is an end-to-end prototype that helps a beneficiary discover relevant government-backed credit schemes, understand why they qualify, estimate repayments, find an operationally eligible channel partner, and create a trackable application. It was developed for **SIH Problem Statement 26092** (Ministry of Social Justice and Empowerment).

> **Prototype notice:** Scheme rules, interest rates, eligibility results, partner records, capacity indicators, analytics, and calculations are illustrative unless independently verified from an official source. This project is not a loan-sanctioning system.

## What it does

```text
Applicant profile
      ↓
Explainable scheme recommendations
      ↓
Illustrative EMI estimate
      ↓
Eligible partner routing by scheme + location
      ↓
Prototype application and status tracking
```

- Guides beneficiaries through eligibility and scheme discovery
- Ranks compatible schemes with a visible, deterministic score breakdown
- Calculates illustrative reducing-balance EMI, repayment total, and moratorium inputs
- Filters and ranks partners by authorization, availability, capacity, risk signals, and distance
- Supports PIN-code or browser-geolocation partner lookup with an OpenStreetMap-based map view
- Creates a prototype application ID and timeline
- Provides English, Hindi, and Kannada interfaces
- Includes a prototype authority dashboard and demo profiles for walkthroughs

## Technology

| Area | Stack |
| --- | --- |
| Web app | React 19, TypeScript, Vite, Tailwind CSS, Wouter |
| Data fetching | TanStack React Query, generated OpenAPI client |
| API | Express 5, Zod validation, Pino logging |
| API contract | OpenAPI 3.1, Orval-generated React client and Zod schemas |
| Data layer | Drizzle ORM and PostgreSQL-ready database package |
| UI | Radix UI, Lucide, Recharts, Framer Motion |
| Package manager | pnpm workspaces |

## Repository layout

```text
artifacts/
├── schemesathi/       # SamarthLoan React frontend
├── api-server/        # Express API and prototype routing services
└── mockup-sandbox/    # Isolated UI/mockup workspace
lib/
├── api-spec/          # OpenAPI contract and Orval configuration
├── api-zod/           # Generated request/response schemas
├── api-client-react/  # Generated React Query client
└── db/                # Drizzle database package and schema
scripts/               # Workspace utility scripts
attached_assets/       # Static assets used by the frontend
```

## Quick start

### Prerequisites

- Node.js 20 or later
- pnpm 9 or later

The repository intentionally requires pnpm. Do not use npm or Yarn for installation.

```bash
corepack enable
pnpm install
```

### Run locally

The API and frontend run separately. Open two terminals from the repository root.

**Terminal 1 — API (`http://localhost:3000`)**

```bash
PORT=3000 pnpm --filter @workspace/api-server dev
```

**Terminal 2 — frontend (`http://localhost:5173`)**

```bash
PORT=5173 BASE_PATH=/ API_URL=http://localhost:3000 \
  pnpm --filter @workspace/samarthloan dev
```

The Vite frontend proxies `/api` requests to `API_URL`; it defaults to `http://localhost:3000` when `API_URL` is omitted.

### Verify and build

```bash
# Type-check libraries, apps, and scripts
pnpm typecheck

# Type-check and build every workspace package that exposes a build script
pnpm build

# Build only the frontend
pnpm --filter @workspace/samarthloan build

# Build only the API
pnpm --filter @workspace/api-server build
```

## API overview

All API paths are mounted under `/api`. The source of truth is [lib/api-spec/openapi.yaml](lib/api-spec/openapi.yaml).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/schemes` | List prototype schemes |
| `GET` | `/api/schemes/:id` | Read a scheme |
| `POST` | `/api/schemes/recommend` | Rank schemes for an applicant profile |
| `POST` | `/api/calculator/emi` | Calculate an illustrative EMI |
| `GET` | `/api/partners` | List demo channel partners |
| `GET` | `/api/partners/eligible` | Filter and rank eligible partners |
| `POST` | `/api/partners/recommend` | Rank partner matches |
| `POST` | `/api/applications` | Create a prototype application |
| `GET` | `/api/applications/:id` | Retrieve application tracking state |
| `GET` | `/api/admin/analytics` | Read prototype dashboard analytics |

Example partner lookup:

```bash
curl 'http://localhost:3000/api/partners/eligible?schemeId=scheme-id&pincode=560001'
```

`/api/partners/eligible` requires `schemeId` and accepts either `latitude`/`longitude` or a six-digit Indian `pincode`.

## How recommendations work

SamarthLoan’s matching is intentionally deterministic and explainable:

| Recommendation | Scoring factors |
| --- | --- |
| Scheme match | Income compatibility (25%), project type (25%), loan amount (20%), applicant type (15%), purpose (10%), other eligibility (5%) |
| Partner match | Scheme compatibility (40%), availability (25%), processing capacity (20%), distance (15%) |

Incompatible applicant types and loan amounts are excluded before scheme ranking. The eligible-partner flow applies authorization, active status, supported scheme, application acceptance, utilization, NPA/overdue, and capacity checks before using Haversine straight-line distance to rank the remaining partners. Its configurable thresholds and weights are in `artifacts/api-server/src/services/partner-routing.ts`.

The financial calculator uses the standard reducing-balance EMI formula with monthly interest and installments. Its result is illustrative and is not a loan offer or sanction quote.

## API contract and generated code

When changing API shapes, update the OpenAPI definition first, then regenerate the client and schemas:

```bash
pnpm --filter @workspace/api-spec codegen
pnpm typecheck
```

Generated outputs are consumed by the frontend from `@workspace/api-client-react` and by the API from `@workspace/api-zod`. Keeping the contract first prevents client/server drift.

## Database

The `@workspace/db` package is prepared for Drizzle and PostgreSQL-backed persistence. Current scheme, partner, and analytics records support the prototype experience and should be treated as demo data.

```bash
# Apply schema changes after configuring the database connection
pnpm --filter @workspace/db push

# Upsert the prototype scheme catalogue and partner records
pnpm --filter @workspace/db seed
```

Set `DATABASE_URL` in your shell or deployment secret store before running either command. The seed is idempotent: it updates the current prototype IDs rather than creating duplicates. Do not run the force variant of the schema command against an environment containing data you need to retain.

## Contributing

1. Create a branch from `main`.
2. Make the smallest focused change.
3. If the API changes, update `lib/api-spec/openapi.yaml` and regenerate code.
4. Run `pnpm typecheck` and the relevant build command.
5. Clearly identify any non-production demo data or assumptions in the pull request.

### Data and privacy guidance

- Do not commit credentials, Aadhaar numbers, bank details, or other sensitive personal information.
- Keep all sample beneficiary and partner data clearly marked as simulated.
- Treat eligibility results and EMI output as guidance only until rules and rates are verified with the relevant authorities and lenders.
- Validate any production integration, consent flow, identity verification, and data-retention policy before deployment.

## License

MIT. See the root `package.json` for the declared license.
