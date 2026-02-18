export type Monitor = {
  id: number;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string> | null;
  body: string | null;
  timeout: number;
  interval: number;
  acceptable_status_codes: string[];
  dns_time_threshold: number | null;
  connect_time_threshold: number | null;
  ttfb_threshold: number | null;
  response_time_threshold: number | null;
  is_active: boolean;
  status: 'unknown' | 'up' | 'degraded' | 'down';
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MonitorCheck = {
  id: number;
  monitor_id: number;
  status: 'success' | 'success_degraded' | 'failure';
  status_code: number | null;
  response_time: number | null;
  dns_time: number | null;
  connect_time: number | null;
  ttfb: number | null;
  error_message: string | null;
  checked_at: string;
}

export type MonitorMetrics = {
  period: string;
  uptime_percentage: number;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  avg_response_time: number | null;
  avg_dns_time: number | null;
  avg_connect_time: number | null;
  avg_ttfb: number | null;
}
