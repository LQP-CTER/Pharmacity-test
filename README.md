# Pharmacity Hub-Spoke Analytics

An interactive analytics dashboard built for the **Retail Innovation Project Analyst** skills
assessment (Section B — Data Analysis Skills & Business Mindset). It turns the raw Hub-Spoke
distribution data into a live, filterable view of network performance, order tracking, and
operational bottlenecks.

**Live demo:** _add your Vercel URL here after deploying_
**Author:** Le Quy Phat

---

## What this covers

The dashboard maps directly onto the four tasks in Section B:

| Tab | Section B Task | What it shows |
|---|---|---|
| Overview | — | Network-wide snapshot pulled from the other three tabs |
| Revenue Performance | Task 1 | Monthly revenue by Region and by Hub / Spoke group, with KPIs on network structure |
| Hub Order Tracking | Task 2 | Daily volume of Transfer Orders created by Hub stores, and their status mix over time |
| Transfer Order Ops | Task 4 | Delivery status, lead time, and which Hub stores are driving delays or cancellations |

Task 3 (Business Insights) is written up separately in `SectionB_Report.docx`, alongside the
supporting Excel workbook (`SectionB_Analysis.xlsx`) — this dashboard is the interactive
companion to that analysis, not a replacement for it.

## Key features

- **Region and Group filtering** — the Overview and Revenue Performance tabs let you narrow
  the data to specific regions and/or Hub / Spoke / Other groups. Every KPI, table, and chart
  on those tabs recalculates from the filtered rows rather than showing static totals.
- **Four focused views** instead of one crowded page, navigated from a fixed sidebar.
- **Charts built with Recharts**: a regional revenue trend line, a daily order-tracking line
  chart, a stacked bar breakdown by status, and a donut chart for order status distribution.
- **No backend required** — all figures are pre-aggregated from the source Excel files and
  shipped as a static JSON file (`src/data.json`), so the app is just static files once built.

## Data sources and methodology

The underlying numbers come from the files in the assessment's `SECTION B` folder:

- `Sale 6M/2023_0[1-7]_Sales.xlsx` — monthly net revenue and transaction counts per store,
  January through July 2023.
- `List HUB Spoke.xlsx` and `Store information.xlsx` — store-to-region mapping and each
  store's role in the network (Hub, Spoke, or Other).
- `Transfer Order Detail July.xlsx` — line-level Transfer Order records for July 2023, used
  for the order-tracking and operational-bottleneck views.

These were cleaned and aggregated in Python (pandas), then exported once into
`src/data.json`. If the source data changes, re-run the aggregation script and regenerate
that file — the dashboard itself has no data-processing logic.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev server and production builds
- [Recharts](https://recharts.org/) for charts

## Project structure

```
hubspoke-dashboard/
├── src/
│   ├── App.tsx        # all tabs, filters, and chart/table components
│   ├── App.css         # layout and component styling
│   ├── index.css       # global resets and typography
│   ├── types.ts         # shared TypeScript types for the dataset
│   ├── data.json         # pre-aggregated dataset (see Methodology above)
│   └── main.tsx           # React entry point
├── index.html
├── package.json
└── vite.config.ts
```

## Getting started

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

This starts a local dev server (Vite will print the URL, typically `http://localhost:5173`).

To type-check and produce a production build:

```bash
npm run build
```

Output is written to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Deploying to Vercel

**Option A — Vercel CLI**

```bash
npm install -g vercel
vercel
```

Accept the default framework preset (Vite); Vercel will run `npm run build` and serve `dist/`
automatically.

**Option B — GitHub + Vercel dashboard**

1. Push this folder to a new GitHub repository.
2. In Vercel, choose **New Project** and import that repository.
3. Leave the framework preset on **Vite** and click **Deploy**.

No environment variables or backend services are needed — the dataset is bundled at build time.

## Notes and limitations

- The dataset is a static snapshot (Jan–Jul 2023 sales, July 2023 transfer orders). The
  dashboard does not fetch live data; refreshing the underlying figures means regenerating
  `src/data.json` and rebuilding.
- Filtering is currently scoped to the Overview and Revenue Performance tabs, since the
  Hub Order Tracking and Transfer Order data don't carry a region/group dimension in the
  source files.
