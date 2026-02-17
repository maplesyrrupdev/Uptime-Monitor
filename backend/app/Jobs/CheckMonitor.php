<?php

namespace App\Jobs;

use App\Models\Monitor;
use App\Services\AlertService;
use App\Services\MonitorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CheckMonitor implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public Monitor $monitor
    ) {}

    public function handle(MonitorService $monitorService, AlertService $alertService): void
    {
        if (!$this->monitor->is_active) {
            Log::info('Монитор не активен, пропускаем проверку', [
                'monitor_id' => $this->monitor->id,
            ]);
            return;
        }

        try {
            Log::info('Начинаем проверку монитора', [
                'monitor_id' => $this->monitor->id,
                'monitor_name' => $this->monitor->name,
                'url' => $this->monitor->url,
            ]);

            $previousStatus = $this->monitor->status;

            $check = $monitorService->checkMonitor($this->monitor);

            $this->monitor->refresh();
            $newStatus = $this->monitor->status;

            Log::info('Проверка монитора окончена', [
                'monitor_id' => $this->monitor->id,
                'status' => $check->status,
                'response_time' => $check->response_time,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
            ]);

            $alertReasons = [];

            if (in_array($previousStatus, ['up', 'degraded']) && $newStatus === 'down') {
                $alertReasons[] = 'failure';
                Log::info('Обнаружен сбой монитора', [
                    'monitor_id' => $this->monitor->id,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                ]);
            }

            if (($previousStatus === 'down' && in_array($newStatus, ['up', 'degraded'])) ||
                ($previousStatus === 'degraded' && $newStatus === 'up')) {
                $alertReasons[] = 'recovery';
                Log::info('Монитор восстановлен', [
                    'monitor_id' => $this->monitor->id,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                ]);
            }

            if ($previousStatus === 'up' && $newStatus === 'degraded') {
                $alertReasons[] = 'threshold_breach';
                Log::info('Обнаружено превышение порогов', [
                    'monitor_id' => $this->monitor->id,
                    'transition' => 'up -> degraded',
                ]);
            }

            foreach ($alertReasons as $reason) {
                $alerts = $alertService->findTriggeredAlerts($this->monitor, $reason);
                foreach ($alerts as $alert) {
                    SendAlert::dispatch($alert, $this->monitor, $reason, $check->id);
                    Log::info('Запланирована отправка алерта', [
                        'alert_id' => $alert->id,
                        'alert_name' => $alert->name,
                        'monitor_id' => $this->monitor->id,
                        'reason' => $reason,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Не удалось проверить монитор', [
                'monitor_id' => $this->monitor->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    private function checkThresholdBreaches($check): array
    {
        $breaches = [];

        if ($this->monitor->dns_time_threshold && $check->dns_time > $this->monitor->dns_time_threshold) {
            $breaches[] = 'dns_time';
        }

        if ($this->monitor->connect_time_threshold && $check->connect_time > $this->monitor->connect_time_threshold) {
            $breaches[] = 'connect_time';
        }

        if ($this->monitor->ttfb_threshold && $check->ttfb > $this->monitor->ttfb_threshold) {
            $breaches[] = 'ttfb';
        }

        if ($this->monitor->response_time_threshold && $check->response_time > $this->monitor->response_time_threshold) {
            $breaches[] = 'response_time';
        }

        return $breaches;
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Задача проверки мониторов провалилась после максимального количества попыток', [
            'monitor_id' => $this->monitor->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
