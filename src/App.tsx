import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import data from "./data.json";
import type { DashboardData, RevenueRow } from "./types";
import "./App.css";

const d = data as DashboardData;

const NAVY = "#0f172a";
const ALL_REGIONS = ["Central", "HCMC", "Mekong Delta", "North", "South East"];
const ALL_GROUPS = ["Hub", "Spoke", "Other"];

const REGION_COLORS: Record<string, string> = {
  Central: "#64748b",
  HCMC: "#00a651",
  "Mekong Delta": "#94a3b8",
  North: "#cbd5e1",
  "South East": "#475569",
};
const STATUS_COLORS: Record<string, string> = {
  Received: "#10b981",
  Shipped: "#3b82f6",
  Created: "#64748b",
  Canceled: "#ef4444",
};

async function fetchGroqInsight(promptContext: string, dataContext: string) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GROQ_API_KEY in .env");

  const prompt = `You are a Senior Retail Operations Analyst at Pharmacity, analyzing a Hub-Spoke distribution model.
  Analyze the following data related to: ${promptContext}.
  Provide exactly two paragraphs. 
  Paragraph 1 must start with "Insight: " and contain your analysis of the data. 
  Paragraph 2 must start with "Actionable: " and contain practical recommendations to improve operations.
  Keep it concise, professional, and focus on bottlenecks, stock availability, and logistics.
  Do not use any emojis or markdown formatting like **.
  Data: ${dataContext}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "qwen/qwen3-32b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    })
  });
  
  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const errBody = await res.json();
      if (errBody.error && errBody.error.message) {
        errorMsg = errBody.error.message;
      }
    } catch (e) {
      // Ignored
    }
    throw new Error(`API Error: ${errorMsg}`);
  }
  
  const data = await res.json();
  return data.choices[0].message.content;
}

function AiInsight({ context, data }: { context: string; data: any }) {
  const [insight, setInsight] = useState<string>("");
  const [actionable, setActionable] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchGroqInsight(context, JSON.stringify(data));
      // Remove <think> blocks from reasoning models
      const cleanResponse = response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const parts = cleanResponse.split(/Actionable:/i);
      const iText = parts[0].replace(/Insight:/i, "").trim();
      const aText = parts[1] ? parts[1].trim() : "";
      setInsight(iText);
      setActionable(aText);
    } catch (err: any) {
      setError(err.message || "Failed to fetch insight");
    } finally {
      setLoading(false);
    }
  };

  if (!insight && !loading && !error) {
    return (
      <div className="ai-insight-box ai-insight-empty">
        <button className="ai-btn" onClick={handleGenerate}>Generate AI Insight</button>
      </div>
    );
  }

  return (
    <div className="ai-insight-box">
      <div className="ai-insight-header">
        <h4>AI Insight</h4>
        <button className="ai-btn ai-btn-small" onClick={handleGenerate} disabled={loading}>
          {loading ? "Analyzing..." : "Regenerate"}
        </button>
      </div>
      {error && <p className="ai-error">{error}</p>}
      {loading && !insight && <p className="ai-loading">Analyzing data...</p>}
      {insight && (
        <>
          <p><strong>Insight:</strong> {insight}</p>
          {actionable && <p><span className="actionable-text">Actionable:</span> {actionable}</p>}
        </>
      )}
    </div>
  );
}

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
        <AiInsight 
          context="Monthly Net Revenue by Region (Overview)"
          data={trend}
        />
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
        <AiInsight 
          context="Monthly Revenue by Region and Hub-Spoke Group"
          data={rows}
        />
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
        <AiInsight 
          context="Revenue Trend by Region (Line Chart)"
          data={trend}
        />
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
        <AiInsight 
          context="Transfer Orders created each day by Hub stores, July 2023"
          data={d.hubTracking}
        />
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
        <AiInsight 
          context="Transfer Orders created each day, broken down by Status (Created, Shipped, Received, Canceled)"
          data={d.hubTracking}
        />
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
          <AiInsight 
            context="Transfer Order Status Distribution (Percentage of Orders Canceled, Shipped, Received)"
            data={d.tfStatus}
          />
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
          <AiInsight 
            context="Bottleneck View: Which Hub stores ship the most, and where cancellations pile up"
            data={d.bottleneck}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function AiTab() {
  return (
    <div>
      <SectionLabel text="Academic & Machine Learning" />
      <div className="grid-2">
        <ChartCard title="Cancellation Drivers (Feature Importance)" subtitle="Random Forest: Influence on order cancellations">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={d.featureImportance} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebef" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e8ebef" }} tickLine={false} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e8ebef" }} />
              <Bar dataKey="importance" fill="#475569" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard title="Flight Risk Radar" subtitle="AI Prediction: Hubs with highest probability of bottlenecks and cancellations">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="left">Hub Store</th>
                  <th>Cancel Risk (%)</th>
                  <th className="left">Lead Time Alert</th>
                </tr>
              </thead>
              <tbody>
                {d.aiPredictions.map((r, i) => (
                  <tr key={i}>
                    <td className="left">{r.store}</td>
                    <td className={`num${r.cancelRiskPct > 50 ? " flag" : ""}`}>{r.cancelRiskPct}%</td>
                    <td className="left">
                      <span className={`badge ${r.leadTimeRisk === "High" ? "badge-other flag" : "badge-spoke"}`}>{r.leadTimeRisk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AiInsight 
            context="Flight Risk Radar - AI Prediction: Hubs with highest probability of bottlenecks and cancellations. Model: Lead Time > 2 Days is the primary driver."
            data={d.aiPredictions}
          />
        </ChartCard>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "A · Overview" },
  { id: "revenue", label: "B · Revenue Performance" },
  { id: "tracking", label: "C · Order Tracking" },
  { id: "transfer", label: "D · Transfer Ops" },
  { id: "ai", label: "E · AI & Machine Learning" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_META: Record<TabId, { title: string; subtitle: string; filterable: boolean }> = {
  overview: { title: "A · Overview", subtitle: "A quick snapshot of the whole Hub-Spoke network, pulled from all four tasks below", filterable: true },
  revenue: { title: "B · Revenue Performance", subtitle: "How revenue breaks down by region and by Hub vs. Spoke, month by month (Task 1)", filterable: true },
  tracking: { title: "C · Hub Order Tracking", subtitle: "How many orders Hub stores sent out each day in July (Task 2)", filterable: false },
  transfer: { title: "D · Transfer Operations", subtitle: "Where orders stand today, and where the process is slowing down (Task 4)", filterable: false },
  ai: { title: "E · Predictive Analytics & AI", subtitle: "Machine learning insights predicting Hub bottlenecks and cancellation risks", filterable: false },
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
          {tab === "ai" && <AiTab />}
        </main>
        <footer className="app-footer">Sales data covers Jan-Jul 2023; Transfer Order data covers Jul 2023. Prepared by Le Quy Phat.</footer>
      </div>
    </div>
  );
}

export default App;
