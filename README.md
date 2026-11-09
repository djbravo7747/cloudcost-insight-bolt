# CloudCost Insight

CloudCost Insight is a cloud-cost analytics dashboard built as a college DEVL mini-project. It reconciles synthetic cloud billing, usage, project tags, and budgets to show where spend goes, which resources need an owner, and which budgets are at risk.

The frontend runs entirely on deterministic synthetic data. Its API service layer is designed so the same screens can later read from a FastAPI and PostgreSQL backend without changing any page code.

## Running the application

1. Install dependencies with `npm install`.
2. Start the development server with `npm run dev` and open the printed local address.
3. Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`.

No configuration is required for the demo. To point the app at a backend, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

## Pages

- **Overview**: KPI cards (total spend, monthly budget, budget utilization, untagged resources, budget overruns), monthly trend, cost by service and project, usage versus cost, recent billing records, and resources requiring owner review.
- **Cost Explorer**: date range, project, and service filters; grouping by project, service, or time; total cost, trend chart, detailed billing table, and CSV export.
- **Projects**: portfolio table with spend, budget, utilization, resource count, and ownership status; a project drawer with its resources and billing lines.
- **Resources**: resource inventory with project and owner tags, usage, cost, deployment date, and review status; a drawer with billing evidence (daily cost, recent lines, comparison with prior months).
- **Budgets**: project and service budgets with actual spend, variance, utilization, status, and mute controls for alerts.
- **Data Pipeline**: stage flow (Extract, Validate, Transform, Reconcile, Load, Analyze), a simulated CSV upload, upload history, record counts, validation error report, and run history.
- **Settings**: configurable warning and over-budget thresholds, muted alerts, and the current data source.

## Architecture

```
src/
  App.tsx                 Wraps the layout in state and maps page keys to pages
  config/                 Navigation items and the data source switch (VITE_API_BASE_URL)
  context/                App-wide state: page, billing period, project filter, search, alert thresholds, muted budgets
  data/                   Sample catalog (projects, budgets, resources, pipeline history) and the billing generator
  services/api.ts         The only place that fetches data; every page calls these functions
  hooks/useAsyncData.ts   Loading, error, and retry handling for page data
  lib/                    Pure logic: analytics, tag resolution, formatting, CSV export
  types/                  TypeScript interfaces for billing records, projects, resources, budgets, and pipeline runs
  components/
    common/               Cards, badges, drawers, form controls, progress bars, loading/empty/error states
    charts/               Recharts wrappers with a shared theme
    layout/               Sidebar, top bar, user menu, and page frame
    overview/, projects/, resources/, pipeline/   Feature components used by one page each
  pages/                  One file per page
```

### Data flow

1. A page calls a function in `services/api.ts`, through `useAsyncData`.
2. `api.ts` returns sample data when `VITE_API_BASE_URL` is empty, after a short simulated delay. When it is set, the same calls go to that server with `fetch`.
3. Pages derive their views with the functions in `lib/analytics.ts` (filtering, grouping, budget status, resource review flags).
4. Global filters (billing period, project, search) and alert thresholds live in `AppStateContext`, so every page reacts to them.

## Business rules

- Tag resolution (`lib/tags.ts`): project names are normalized by removing punctuation and case, so variants such as "Atlas-Web" and "atlas web" map to one project. A resource with no project tag, no owner tag, or a name that does not resolve is flagged for review.
- Budget variance = actual cost - budget. Utilization = actual cost / budget x 100.
- Budget status uses the thresholds in Settings (defaults: Warning at 80%, Over budget at 100%).
- Unusual cost: the month's cost is more than 1.4 times the average of earlier months.

## Important limitations

- **Simulated data.** Billing records, budgets, and pipeline history are generated in the browser. The CSV upload only counts lines to estimate results; it does not parse, store, or reconcile the file. Pipeline stages and run history are sample data, not a record of real processing.
- **No persistence.** Settings, muted alerts, and uploads reset when the page is reloaded. Supabase is not connected to this frontend build, because the sample data is intentionally synthetic and the planned backend is FastAPI with PostgreSQL.
- **No authentication.** The app opens directly to the dashboard, as the project scope requires.

## Connecting a FastAPI backend

Set `VITE_API_BASE_URL` to the backend's base address. The service layer calls these paths:

| Function | Method and path |
| --- | --- |
| `getBillingRecords` | GET `/billing-records` |
| `getProjects` | GET `/projects` |
| `getResources` | GET `/resources` |
| `getBudgets` | GET `/budgets` |
| `getCostSummary` | GET `/cost-summary?billing_month=YYYY-MM` |
| `getPipelineHistory` | GET `/pipeline/history` |
| `uploadBillingFile` | POST `/uploads` (multipart form, field `file`) |

Responses must match the interfaces in `src/types/index.ts`. Only `services/api.ts` needs to change if the response shapes differ.
