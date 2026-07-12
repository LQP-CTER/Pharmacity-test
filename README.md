# Pharmacity Hub-Spoke Analytics Dashboard

React + TypeScript + Vite dashboard for Section B (Data Analysis Skills & Business Mindset)
of the Retail Innovation Project Analyst skills assessment.

Covers all 4 Section B tasks:
1. Revenue performance by Region & Hub-Spoke Group + KPIs
2. Hub Order Tracking chart
3. (Insights are documented in SectionB_Report.docx)
4. Transfer Order operational analysis (status, lead time, bottlenecks)

Data is pre-computed and embedded in `src/data.json` (no backend needed).

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Option A — Vercel CLI:
```bash
npm install -g vercel
vercel
```
Follow the prompts (framework preset: Vite). That's it — Vercel auto-detects
`npm run build` and serves the `dist` folder.

Option B — GitHub + Vercel dashboard:
1. Push this folder to a new GitHub repo.
2. Go to vercel.com -> New Project -> Import the repo.
3. Framework preset: Vite (auto-detected). Click Deploy.

## Tech
- React 19 + TypeScript
- Vite (build tool)
- Recharts (charts: line, stacked bar, pie)
