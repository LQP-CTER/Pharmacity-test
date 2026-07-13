export interface RevenueRow {
  region: string;
  group: string;
  monthly: number[];
  total: number;
  stores: number;
}

export interface Kpis {
  totalRevenueB: number;
  hubSharePct: number;
  hubStores: number;
  spokeStores: number;
  avgMonthlyRevPerHub: number;
  avgMonthlyRevPerSpoke: number;
  hubSpokeRatio: number;
}

export interface RegionTrendRow {
  month: string;
  [region: string]: string | number;
}

export interface HubTrackingRow {
  date: string;
  Created: number;
  Shipped: number;
  Received: number;
  Canceled: number;
  Total: number;
}

export interface TfStatusRow {
  status: string;
  count: number;
}

export interface BottleneckRow {
  SHIPPED_STORE: string;
  TFCount: number;
  CancelRate: number;
}

export interface TfKpis {
  totalTF: number;
  receivedCount: number;
  receivedPct: number;
  shippedCount: number;
  createdCount: number;
  canceledCount: number;
  canceledPct: number;
  avgLeadTime: number;
  sameDayPct: number;
  leadTimeGe2Pct: number;
  hubOriginPct: number;
}

export interface FeatureImportanceRow {
  feature: string;
  importance: number;
}

export interface AiPredictionRow {
  store: string;
  cancelRiskPct: number;
  leadTimeRisk: string;
}

export interface DashboardData {
  months: string[];
  revenueTable: RevenueRow[];
  kpis: Kpis;
  regionTrend: RegionTrendRow[];
  hubTracking: HubTrackingRow[];
  tfStatus: TfStatusRow[];
  bottleneck: BottleneckRow[];
  tfKpis: TfKpis;
  featureImportance: FeatureImportanceRow[];
  aiPredictions: AiPredictionRow[];
}
