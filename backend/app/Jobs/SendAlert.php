<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\Monitor;
use App\Models\MonitorCheck;
use App\Services\AlertService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendAlert implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        public Alert $alert,
        public Monitor $monitor,
        public string $triggerReason,
        public ?int $checkId = null
    ) {}

    public function handle(AlertService $alertService): void
    {
        $check = $this->checkId ? MonitorCheck::find($this->checkId) : null;

        Log::info('Отправка алерта', [
            'alert_id' => $this->alert->id,
            'alert_name' => $this->alert->name,
            'monitor_id' => $this->monitor->id,
            'monitor_name' => $this->monitor->name,
            'trigger_reason' => $this->triggerReason,
        ]);

        $result = $alertService->sendWebhook(
            $this->alert,
            $this->monitor,
            $this->triggerReason,
            $check
        );

        if ($result['success']) {
            Log::info('Алерт успешно отправлен', [
                'alert_id' => $this->alert->id,
                'status_code' => $result['status_code'],
            ]);
        } else {
            Log::warning('Ошибка при отправке алерта', [
                'alert_id' => $this->alert->id,
                'error' => $result['error'] ?? 'HTTP ' . $result['status_code'],
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Не удалось отправить алерт после всех попыток', [
            'alert_id' => $this->alert->id,
            'monitor_id' => $this->monitor->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
