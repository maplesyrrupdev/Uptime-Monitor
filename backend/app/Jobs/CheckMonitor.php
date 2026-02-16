<?php

namespace App\Jobs;

use App\Models\Monitor;
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

    public function handle(MonitorService $monitorService): void
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

            $check = $monitorService->checkMonitor($this->monitor);

            Log::info('Проверка монитора окончена', [
                'monitor_id' => $this->monitor->id,
                'status' => $check->status,
                'response_time' => $check->response_time,
            ]);
        } catch (\Exception $e) {
            Log::error('Не удалось проверить монитор', [
                'monitor_id' => $this->monitor->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Задача проверки мониторов провалилась после максимального количества попыток', [
            'monitor_id' => $this->monitor->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
