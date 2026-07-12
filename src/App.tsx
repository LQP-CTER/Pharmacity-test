import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import data from "./data.json";
import type { DashboardData, RevenueRow } from "./types";
import "./App.css";

const d = data as DashboardData;

const NAVY = "#1B3A5C";
const ALL_REGIONS = ["Central", "HCMC", "Mekong Delta", "North", "South East"];
const ALL_GROUPS = ["Hub", "Spoke", "Other"];

const REGION_COLORS: Record<string, string> = {
  Central: "#2E6DA4",
  HCMC: "#E08A2C",
  "Mekong Delta": "#3D9970",
  North: "#C0392B",
  "South East": "#7E57C2",
};
const STATUS_COLORS: Record<string, string> = {
  Received: "#3D9970",
  Shipped: "#E0A62C",
  Created: "#2E6DA4",
  Canceled: "#C0392B",
};

interface Filters {
  regions: string[];
  groups: string[];
}

function SectionLabel({ text }: { text: string }) {
  return <div className="section-label">{text}</div>;
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "default" | "warn" }) {
  return (
    <div className={`kpi-card${tone === "warn" ? " kpi-warn" : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const allRegionsOn = filters.regions.length === ALL_REGIONS.length;
  const allGroupsOn = filters.groups.length === ALL_GROUPS.length;

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Region</span>
        <div className="pill-row">
          <button
            className={allRegionsOn ? "pill pill-all active" : "pill pill-all"}
            onClick={() => onChange({ ...filters, regions: allRegionsOn ? [] : [...ALL_REGIONS] })}
          >
            All
          </button>
          {ALL_REGIONS.map((r) => (
            <button
              key={r}
              className={filters.regions.includes(r) ? "pill active" : "pill"}
              onClick={() => onChange({ ...filters, regions: toggle(filters.regions, r) })}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">Group</span>
        <div className="pill-row">
          <button
            className={allGroupsOn ? "pill pill-all active" : "pill pill-all"}
            onClick={() => onChange({ ...filters, groups: allGroupsOn ? [] : [...ALL_GROUPS] })}
          >
            All
          </button>
          {ALL_GROUPS.map((g) => (
            <button
              key={g}
              className={filters.groups.includes(g) ? "pill active" : "pill"}
              onClick={() => onChange({ ...filters, groups: toggle(filters.groups, g) })}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function filterRows(rows: RevenueRow[], filters: Filters): RevenueRow[] {
  return rows.filter((r) => filters.regions.includes(r.region) && filters.groups.includes(r.group));
}

function buildRegionTrend(rows: RevenueRow[]) {
  const regions = Array.from(new Set(rows.map((r) => r.region)));
  return d.months.map((m, i) => {
    const point: Record<string, string | number> = { month: m };
    regions.forEach((region) => {
      const sum = rows.filter((r) => r.region === region).reduce((s, r) => s + r.monthly[i], 0);
      point[region] = Math.round(sum * 100) / 100;
    });
    return point;
  });
}

function computeKpis(rows: RevenueRow[]) {
  const totalRevenueB = rows.reduce((s, r) => s + r.total, 0);
  const hubRows = rows.filter((r) => r.group === "Hub");
  const spokeRows = rows.filter((r) => r.group === "Spoke");
  const hubRevenue = hubRows.reduce((s, r) => s + r.total, 0);
  const spokeRevenue = spokeRows.reduce((s, r) => s + r.total, 0);
  const hubStores = hubRows.reduce((s, r) => s + r.stores, 0);
  const spokeStores = spokeRows.reduce((s, r) => s + r.stores, 0);
  const avgMonthlyRevPerHub = hubStores ? Math.round((hubRevenue * 1000) / 7 / hubStores) : 0;
  const avgMonthlyRevPerSpoke = spokeStores ? Math.round((spokeRevenue * 1000) / 7 / spokeStores) : 0;
  const hubSpokeRatio = avgMonthlyRevPerSpoke ? Math.round((avgMonthlyRevPerHub / avgMonthlyRevPerSpoke) * 100) / 100 : 0;
  const hubSharePct = totalRevenueB ? Math.round((hubRevenue / totalRevenueB) * 1000) / 10 : 0;
  const regionsWithNoHub = ALL_REGIONS.filter((region) => {
    const inScope = rows.some((r) => r.region === region);
    if (!inScope) return false;
    return !rows.some((r) => r.region === region && r.group === "Hub");
  });
  return {
    totalRevenueB: Math.round(totalRevenueB * 10) / 10,
    hubSharePct,
    hubStores,
    spokeStores,
    avgMonthlyRevPerHub,
    avgMonthlyRevPerSpoke,
    hubSpokeRatio,
    regionsWithNoHub,
  };
}

function OverviewTab({ filters }: { filters: Filters }) {
  const rows = useMemo(() => filterRows(d.revenueTable, filters), [filters]);
  const kpis = useMemo(() => computeKpis(rows), [rows]);
  const trend = useMemo(() => buildRegionTrend(rows), [rows]);
  const trendRegions = Array.from(new Set(rows.map((r) => r.region)));

  return (
    <div>
      <SectionLabel text="Overview" />
      <div className="kpi-grid kpi-grid-3">
        <KpiCard label="Total Revenue (7 Months)" value={`${kpis.totalRevenueB}B VND`} />
        <KpiCard label="Hub Share of Revenue" value={`${kpis.hubSharePct}%`} sub={`${kpis.hubStores} Hub stores vs. ${kpis.spokeStores} Spoke stores`} />
        <KpiCard label="Avg. Revenue per Hub Store / Month" value={`${kpis.avgMonthlyRevPerHub.toLocaleString()}M VND`} />
        <KpiCard label="Avg. Revenue per Spoke Store / Month" value={`${kpis.avgMonthlyRevPerSpoke.toLocaleString()}M VND`} />
        <KpiCard label="Hub vs. Spoke Revenue Ratio" value={`${kpis.hubSpokeRatio}x`} />
        <KpiCard label="Orders Delivered to Spoke Stores" value={`${d.tfKpis.receivedPct}%`} sub={`${d.tfKpis.receivedCount.toLocaleString()} out of ${d.tfKpis.totalTF.toLocaleString()} orders so far`} />
      </div>

      <ChartCard title="Monthly Net Revenue by Region" subtitle="Billion VND, Jan-Jul 2023">
        {rows.length === 0 ? (
          <p className="empty-state">No data for the selected filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebef" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e8ebef" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e8ebef" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {trendRegions.map((region) => (
                <Line key={region} type="monotone" dataKey={region} stroke={REGION_COLORS[region]} strokeWidth={2.25} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function RevenueTab({ filters }: { filters: Filters }) {
  const rows = useMemo(() => filterRows(d.revenueTable, filters), [filters]);
  const kpis = useMemo(() => computeKpis(rows), [rows]);
  const trend = useMemo(() => buildRegionTrend(rows), [rows]);
  const trendRegions = Array.from(new Set(rows.map((r) => r.region)));

  return (
    <div>
      <SectionLabel text="Task 1 · Performance Analysis" />
      <ChartCard title="Monthly Revenue by Region and Hub-Spoke Group" subtitle="Billion VND, Jan-Jul 2023">
        {rows.length === 0 ? (
          <p className="empty-state">No data for the selected filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="left">Region</th>
                  <th className="left">Group</th>
                  {d.months.map((m) => (
                    <th key={m}>{m.slice(5)}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="left">{r.region}</td>
                    <td className="left">
                      <span className={`badge badge-${r.group.toLowerCase()}`}>{r.group}</span>
                    </td>
                    {r.monthly.map((v, j) => (
                      <td key={j} className="num">{v.toFixed(1)}</td>
                    ))}
                    <td className="num bold">{r.total.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      <div className="kpi-grid">
        <KpiCard label="Total Revenue (Selected Filters)" value={`${kpis.totalRevenueB}B VND`} sub="Across Jan-Jul 2023" />
        <KpiCard label="Hub Share of Revenue" value={`${kpis.hubSharePct}%`} sub={`${kpis.hubStores} Hub stores vs. ${kpis.spokeStores} Spoke stores`} />
        <KpiCard label="Hub vs. Spoke Ratio" value={`${kpis.hubSpokeRatio}x`} sub="Revenue per store, Hub vs. Spoke" />
        <KpiCard
          label="Regions with No Hub"
          value={String(kpis.regionsWithNoHub.length)}
          sub={kpis.regionsWithNoHub.length ? kpis.regionsWithNoHub.join(", ") : "None in current selection"}
          tone={kpis.regionsWithNoHub.length ? "warn" : "default"}
        />
      </div>

      <ChartCard title="Revenue Trend by Region">
        {rows.length === 0 ? (
          <p className="empty-state">No data for the selected filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebef" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e8ebef" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e8ebef" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {trendRegions.map((region) => (
                <Line key={region} type="monotone" dataKey={region} stroke={REGION_COLORS[region]} strokeWidth={2.25} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function HubOrderTrackingTab() {
  return (
    <div>
      <SectionLabel text="Task 2 · Data Visualization" />
      <ChartCard title="Hub Order Tracking" subtitle="Transfer Orders created each day by Hub stores, July 2023">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={d.hubTracking} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ebef" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} angle={-45} textAnchor="end" height={60} axisLine={{ stroke: "#e8ebef" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e8ebef" }} />
            <Line type="monotone" dataKey="Total" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Hub Orders by Status" subtitle="Same data, broken down by status">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={d.hubTracking} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ebef" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} angle={-45} textAnchor="end" height={60} axisLine={{ stroke: "#e8ebef" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e8ebef" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Created" stackId="s" fill={STATUS_COLORS.Created} />
            <Bar dataKey="Shipped" stackId="s" fill={STATUS_COLORS.Shipped} />
            <Bar dataKey="Received" stackId="s" fill={STATUS_COLORS.Received} />
            <Bar dataKey="Canceled" stackId="s" fill={STATUS_COLORS.Canceled} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <p className="note">
        The spikes in "Created" orders on Jul 9 and "Canceled" orders on Jul 30 are an artifact of where the data was cut off, not a real trend — orders opened right at the start or still pending right at the end simply haven't had time to move through the pipeline yet.
      </p>
    </div>
  );
}

function TransferOrderTab() {
  const total = d.tfStatus.reduce((s, r) => s + r.count, 0);
  return (
    <div>
      <SectionLabel text="Task 4 · Operational Analysis" />
      <div className="kpi-grid kpi-grid-3">
        <KpiCard label="Total Transfer Orders" value={d.tfKpis.totalTF.toLocaleString()} sub="Distinct orders placed in July 2023" />
        <KpiCard label="Delivered to Spoke Stores" value={`${d.tfKpis.receivedPct}%`} sub={`${d.tfKpis.receivedCount.toLocaleString()} orders so far`} />
        <KpiCard label="Canceled" value={`${d.tfKpis.canceledPct}%`} sub={`${d.tfKpis.canceledCount} orders never made it out`} tone="warn" />
        <KpiCard label="Average Delivery Time" value={`${d.tfKpis.avgLeadTime} days`} sub={`${d.tfKpis.sameDayPct}% arrive the same day`} />
        <KpiCard label="Took 2+ Days to Deliver" value={`${d.tfKpis.leadTimeGe2Pct}%`} tone="warn" />
        <KpiCard label="Orders Sent from a Hub" value={`${d.tfKpis.hubOriginPct}%`} sub="The rest move directly between Spokes" />
      </div>

      <div className="grid-2">
        <ChartCard title="Transfer Order Status Distribution">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={d.tfStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={105}
                innerRadius={55}
                paddingAngle={1}
                label={(entry: any) => `${entry.status}  ${((entry.count / total) * 100).toFixed(1)}%`}
                labelLine={{ stroke: "#9ca3af" }}
              >
                {d.tfStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e8ebef" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bottleneck View" subtitle="Which Hub stores ship the most, and where cancellations pile up">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="left">Hub Store</th>
                  <th>TF Count</th>
                  <th>Cancel Rate</th>
                </tr>
              </thead>
              <tbody>
                {d.bottleneck.map((r) => (
                  <tr key={r.SHIPPED_STORE}>
                    <td className="left">{r.SHIPPED_STORE}</td>
                    <td className="num">{r.TFCount}</td>
                    <td className={`num${r.CancelRate > 4 ? " flag" : ""}`}>{r.CancelRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "revenue", label: "Revenue Performance" },
  { id: "tracking", label: "Hub Order Tracking" },
  { id: "transfer", label: "Transfer Order Ops" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_META: Record<TabId, { title: string; subtitle: string; filterable: boolean }> = {
  overview: { title: "Overview", subtitle: "A quick snapshot of the whole Hub-Spoke network, pulled from all four tasks below", filterable: true },
  revenue: { title: "Revenue Performance", subtitle: "How revenue breaks down by region and by Hub vs. Spoke, month by month (Task 1)", filterable: true },
  tracking: { title: "Hub Order Tracking", subtitle: "How many orders Hub stores sent out each day in July (Task 2)", filterable: false },
  transfer: { title: "Transfer Order Operations", subtitle: "Where orders stand today, and where the process is slowing down (Task 4)", filterable: false },
};

function App() {
  const [tab, setTab] = useState<TabId>("overview");
  const [filters, setFilters] = useState<Filters>({ regions: [...ALL_REGIONS], groups: [...ALL_GROUPS] });
  const meta = TAB_META[tab];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-name">Pharmacity</div>
          <div className="brand-sub">Hub-Spoke Analytics</div>
        </div>
        <nav className="side-nav">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "side-link active" : "side-link"} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-title">Retail Innovation Project Analyst</div>
          <div className="sidebar-footer-sub">Skills Assessment - Section B</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </header>
        {meta.filterable && <FilterBar filters={filters} onChange={setFilters} />}
        <main className="content">
          {tab === "overview" && <OverviewTab filters={filters} />}
          {tab === "revenue" && <RevenueTab filters={filters} />}
          {tab === "tracking" && <HubOrderTrackingTab />}
          {tab === "transfer" && <TransferOrderTab />}
        </main>
        <footer className="app-footer">Sales data covers Jan-Jul 2023; Transfer Order data covers Jul 2023. Prepared by Le Quy Phat.</footer>
      </div>
    </div>
  );
}

export default App;
