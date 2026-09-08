# SarthakLoan

**Smart Credit & Scheme Navigator**

SarthakLoan is a smart credit and scheme navigation platform designed to help eligible beneficiaries identify suitable government-backed financial schemes, estimate loan repayments, and connect with an eligible channel partner.

## Problem statement

Smart Scheme Matching for Marginalized Entrepreneurs — SIH Problem Statement 26092, Ministry of Social Justice and Empowerment.

## Solution

```text
User Profile
    ↓
Scheme Recommendation
    ↓
EMI Calculation
    ↓
Eligible Partner Matching
    ↓
Geo-Spatial Partner Locator
    ↓
Application
```

SarthakLoan turns a citizen's financial need into a clear, explainable path: capture a small applicant profile, rank compatible prototype schemes, explain the score, estimate repayment, route to a suitable demo channel partner, and create a trackable application.

## Features

- Responsive beneficiary home, eligibility wizard, recommendations, scheme details, and dashboard
- Deterministic weighted scheme matching with visible score breakdowns
- EMI calculator with illustrative moratorium input and repayment totals
- Partner ranking using compatibility, availability, capacity, and distance
- Demo partner map-style experience and application routing
- Application ID generation and timeline tracking
- English, Hindi, and Kannada language switching
- Prototype authority dashboard with application, scheme, and partner analytics
- Geo-spatial eligible partner locator with PIN/geolocation fallback, OpenStreetMap area map, and explainable operational filtering
- Rahul Kumar and student demo presets for a fast hackathon walkthrough

## Architecture

```text
React + Vite frontend
        |
Typed OpenAPI client + React Query
        |
Express API server (/api)
        |
Deterministic prototype services
```

## Tech stack

- React, TypeScript, Vite, Tailwind CSS, Wouter
- Express 5, Zod-generated request validation
- Recharts and Lucide React
- OpenAPI + Orval-generated client and schemas

## Matching algorithm

Scheme scores combine income compatibility (25%), project type (25%), loan amount (20%), applicant type (15%), purpose (10%), and other eligibility (5%). Clearly incompatible applicant types and loan amounts are filtered before ranking.

Partner scores combine scheme compatibility (40%), availability (25%), processing capacity (20%), and distance (15%).

## Geo-spatial partner locator

The partner flow is deliberately ordered as:

```text
User location -> selected scheme -> authorization and operational eligibility
-> Haversine distance -> configurable ranking -> partner details -> application
```

`GET /api/partners/eligible` accepts `schemeId` plus either `latitude`/`longitude` or a supported Indian PIN code. It removes unauthorized, inactive, unsupported, non-accepting, over-utilized, high-NPA, high-overdue, and capacity-constrained partners before ranking. Ranking weights and thresholds live in `artifacts/api-server/src/services/partner-routing.ts` so they can later move to verified policy or partner data.

The map uses real OpenStreetMap tiles. Partner records and financial/operational indicators are simulated prototype data, clearly surfaced as such in the application. Distances use Haversine straight-line calculations; a future road-routing provider can replace that service without changing the frontend contract.

## Financial calculator

The calculator uses the standard reducing-balance EMI formula with monthly interest and monthly installments. Results are illustrative and not a sanction quote; actual repayment treatment depends on scheme and lender guidelines.

## Running locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/sarthakloan run dev
```

For the managed preview, use the configured workflows. Validate with:

```bash
pnpm run typecheck
```

## Prototype disclosure

SarthakLoan is a prototype developed for demonstration under SIH Problem Statement 26092. Scheme rules, rates, eligibility, partner availability, analytics, and financial calculations shown here are illustrative unless explicitly verified from official sources. No Aadhaar, bank credentials, or sensitive identity verification is collected.