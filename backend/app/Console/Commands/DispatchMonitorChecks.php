<?php

namespace App\Console\Commands;

use App\Jobs\CheckMonitor;
use App\Models\Monitor;
use Illuminate\Console\Command;

class DispatchMonitorChecks extends Command
{
    protected $signature = 'monitors:dispatch-checks';
    protected $description = 'Отправить задачи проверки для мониторов, которым пора проверяться';

    public function handle(): int
    {
        $this->info('Проверка мониторов, которым пора проверяться...');

        $endTime = now()->addSeconds(55);

        while (true) {
            $this->checkMonitors();

            if (now()->greaterThanOrEqualTo($endTime)) {
                break;
            }

            sleep(1);
        }

        return self::SUCCESS;
    }

    protected function checkMonitors()
    {
        $monitors = Monitor::where('is_active', true)
            ->get()
            ->filter(function (Monitor $monitor) {
                if ($monitor->last_checked_at === null) {
                    return true;
                }

                $nextCheckTime = $monitor->last_checked_at->copy()->addSeconds($monitor->interval);
                return $nextCheckTime->isPast();
            });

        if ($monitors->isEmpty()) {
            $this->info('Нет мониторов для проверки.');
            return;
        }

        $count = 0;
        foreach ($monitors as $monitor) {
            CheckMonitor::dispatch($monitor);

            $monitor->update(['last_checked_at' => now()]);

            $count++;
            $this->info("Отправлена задача для монитора: {$monitor->name} (ID: {$monitor->id})");
        }

        $this->info("Отправлено задач: {$count}");
    }
}
