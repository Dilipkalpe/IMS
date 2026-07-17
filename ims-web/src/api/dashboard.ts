import { apiFetch } from './client';

export interface DashboardStat {
  label: string;
  value: string;
  iconGlyph: string;
  accentColor: string;
}

export interface DashboardRow {
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  status: string;
}

export interface DashboardAlert {
  title: string;
  detail: string;
  severity: string;
  iconGlyph: string;
}

export interface DashboardSummaryLine {
  label: string;
  value: string;
  iconGlyph: string;
}

export interface DashboardChartSeries {
  title: string;
  series1Name?: string;
  series2Name?: string;
  series1Color?: string;
  series2Color?: string;
  labels: string[];
  series1?: number[];
  series2?: number[];
  slices?: Array<{ label: string; value: number; color: string }>;
}

export interface DashboardPayload {
  stats: DashboardStat[];
  rows: DashboardRow[];
  alerts: DashboardAlert[];
  summaryLines: DashboardSummaryLine[];
  charts: {
    salesVsPurchase: DashboardChartSeries;
    stockByCategory: DashboardChartSeries;
    stockByType: DashboardChartSeries;
  };
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  return apiFetch<DashboardPayload>('/api/dashboard');
}
