<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\AlertLog;
use App\Models\Monitor;
use App\Models\MonitorCheck;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AlertService
{
    public function renderTemplate(string $template, Monitor $monitor, ?MonitorCheck $check = null): string
    {
        $variables = [
            '{name}' => $monitor->name,
            '{url}' => $monitor->url,
            '{status}' => $monitor->status,
            '{timestamp}' => now()->toIso8601String(),
        ];

        if ($check) {
            $variables['{dns_time}'] = $check->dns_time ? $check->dns_time . 'ms' : 'N/A';
            $variables['{connect_time}'] = $check->connect_time ? $check->connect_time . 'ms' : 'N/A';
            $variables['{ttfb}'] = $check->ttfb ? $check->ttfb . 'ms' : 'N/A';
            $variables['{response_time}'] = $check->response_time ? $check->response_time . 'ms' : 'N/A';
            $variables['{error_message}'] = $check->error_message ?? '';
            $variables['{status_code}'] = $check->status_code ?? 'N/A';
        } else {
            $variables['{dns_time}'] = 'N/A';
            $variables['{connect_time}'] = 'N/A';
            $variables['{ttfb}'] = 'N/A';
            $variables['{response_time}'] = 'N/A';
            $variables['{error_message}'] = '';
            $variables['{status_code}'] = 'N/A';
        }

        return str_replace(array_keys($variables), array_values($variables), $template);
    }

    public function sendWebhook(
        Alert $alert,
        Monitor $monitor,
        string $triggerReason,
        ?MonitorCheck $check = null
    ): array {
        $body = $alert->webhook_body
            ? $this->renderTemplate($alert->webhook_body, $monitor, $check)
            : null;

        $headers = is_array($alert->webhook_headers) ? $alert->webhook_headers : [];

        try {
            $method = strtolower($alert->webhook_method);

            if ($method === 'post') {
                $response = Http::withHeaders($headers)
                    ->timeout(30)
                    ->send('POST', $alert->webhook_url, [
                        'body' => $body,
                    ]);
            } else {
                $response = Http::withHeaders($headers)
                    ->timeout(30)
                    ->get($alert->webhook_url);
            }

            $statusCode = $response->status();
            $responseBody = $response->body();
            $success = $response->successful();

            AlertLog::create([
                'alert_id' => $alert->id,
                'monitor_id' => $monitor->id,
                'trigger_reason' => $triggerReason,
                'payload_sent' => [
                    'url' => $alert->webhook_url,
                    'method' => $alert->webhook_method,
                    'headers' => $headers,
                    'body' => $body,
                ],
                'response_status' => $statusCode,
                'response_body' => $responseBody,
                'error_message' => $success ? null : "HTTP {$statusCode}: {$responseBody}",
                'sent_at' => now(),
            ]);

            return [
                'success' => $success,
                'status_code' => $statusCode,
                'response_body' => $responseBody,
            ];
        } catch (\Exception $e) {
            Log::error('Не удалось отправить алерт', [
                'alert_id' => $alert->id,
                'monitor_id' => $monitor->id,
                'error' => $e->getMessage(),
            ]);

            AlertLog::create([
                'alert_id' => $alert->id,
                'monitor_id' => $monitor->id,
                'trigger_reason' => $triggerReason,
                'payload_sent' => [
                    'url' => $alert->webhook_url,
                    'method' => $alert->webhook_method,
                    'headers' => $headers,
                    'body' => $body,
                ],
                'response_status' => null,
                'response_body' => null,
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);

            return [
                'success' => false,
                'status_code' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function findTriggeredAlerts(Monitor $monitor, string $triggerReason): array
    {
        return Alert::where('is_active', true)
            ->where(function ($query) use ($monitor) {
                $query->whereDoesntHave('monitors')
                    ->orWhereHas('monitors', function ($q) use ($monitor) {
                        $q->where('monitors.id', $monitor->id);
                    });
            })
            ->get()
            ->filter(function (Alert $alert) use ($triggerReason) {
                $triggers = is_array($alert->trigger_on) ? $alert->trigger_on : json_decode($alert->trigger_on, true);
                return in_array($triggerReason, $triggers ?? []);
            })
            ->all();
    }
}
