# Project memory

## Product intent & audience

- **CloudCost Insight**: cloud cost analytics web app, full-stack-ready.
- Core features: reconcile cloud usage and spend, allocate costs, surface resources requiring owner review.
- Audience: cloud ops / FinOps / engineering managers reviewing spend and accountability.

## Brand personality & voice

- Professional, data-driven, trustworthy.
- Clarity over marketing language; emphasize insight and action.

## Visual design & UX direction

- Production-grade UI; avoid generic/cookie-cutter layouts.
- Analytics/dashboard aesthetic: dense but legible tables, cost breakdowns, allocation views, review queues.
- Framework conventions: Vite + React, JSX + Tailwind CSS, React hooks, `lucide-react` for icons, `@/` path alias to `src/`.
- Likely patterns: KPI cards, charts/tables for spend, per-resource owner-review flags.

## Decisions, constraints & rationale

- GitHub repo exists and is user-owned: `https://github.com/djbravo7747/cloudcost-insight` (created empty).
- Bolt GitHub integration cannot attach an empty repo directly; can only import repos with at least one file or create a new repo.
- Did not create a new repo (per user constraint); provided manual export/upload steps instead.
- Code has not yet been pushed to GitHub.
- Manual fallback steps provided: Download project from Bolt, add `README.md` to empty repo, upload files excluding `.env`, `node_modules`, `dist`.

## Open questions & assumptions

- Assumes single-cloud or abstracted cost data model; multi-cloud support unconfirmed.
- Data ingestion source/API for usage and spend not yet specified.
- Owner identity source for resources (tags, org directory, manual assignment) unknown.
- Auth and multi-user support not yet defined.
- Whether user will proceed with manual upload or start a new synced Bolt project is unresolved.