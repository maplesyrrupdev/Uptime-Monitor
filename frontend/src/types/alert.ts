export type Alert = {
  id: number;
  name: string;
  trigger_on: string[];
  webhook_url: string;
  webhook_method: 'GET' | 'POST';
  webhook_headers: Record<string, string> | null;
  webhook_body: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  monitors?: {
    id: number;
    name: string;
  }[];
};

export type AlertLog = {
  id: number;
  alert_id: number;
  monitor_id: number;
  trigger_reason: string;
  payload_sent: {
    url: string;
    method: string;
    headers: any[];
    body: string;
  };
  response_status: number | null;
  sent_at: string;
  created_at: string;
  updated_at: string;
  response_body: string | null;
  error_message: string | null;
  monitor: {
    id: number;
    name: string;
    url: string;
  };
};

export type CreateAlertData = {
  name: string;
  monitor_ids: number[];
  trigger_on: string[];
  webhook_url: string;
  webhook_method: 'GET' | 'POST';
  webhook_headers: Record<string, string>;
  webhook_body: string | null;
  is_active: boolean;
};

export type UpdateAlertData = CreateAlertData;
