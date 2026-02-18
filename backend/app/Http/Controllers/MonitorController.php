<?php

namespace App\Http\Controllers;

use App\Jobs\SendAlert;
use App\Models\Monitor;
use App\Services\AlertService;
use App\Services\MonitorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MonitorController extends Controller
{
    public function __construct(
        private MonitorService $monitorService,
        private AlertService $alertService
    ) {}

    public function index()
    {
        $monitors = Monitor::orderBy('created_at', 'desc')->get();

        return response()->json([
            'monitors' => $monitors,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:2048',
            'method' => ['required', Rule::in(['GET', 'POST'])],
            'headers' => 'nullable|array',
            'headers.*' => 'string',
            'body' => 'nullable|string',
            'timeout' => 'nullable|integer|min:1|max:300',
            'interval' => 'nullable|integer|min:30|max:3600',
            'acceptable_status_codes' => 'nullable|array',
            'acceptable_status_codes.*' => 'string',
            'dns_time_threshold' => 'nullable|integer|min:0',
            'connect_time_threshold' => 'nullable|integer|min:0',
            'ttfb_threshold' => 'nullable|integer|min:0',
            'response_time_threshold' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ], [
            'name.required' => 'Укажите название монитора',
            'name.max' => 'Название не должно превышать 255 символов',
            'url.required' => 'Укажите URL для мониторинга',
            'url.url' => 'Укажите корректный URL',
            'url.max' => 'URL не должен превышать 2048 символов',
            'method.required' => 'Укажите HTTP метод',
            'method.in' => 'Метод должен быть GET или POST',
            'timeout.integer' => 'Таймаут должен быть числом',
            'timeout.min' => 'Таймаут должен быть не менее 1 секунды',
            'timeout.max' => 'Таймаут не должен превышать 300 секунд',
            'interval.integer' => 'Интервал должен быть числом',
            'interval.min' => 'Интервал должен быть не менее 30 секунд',
            'interval.max' => 'Интервал не должен превышать 3600 секунд',
            'dns_time_threshold.integer' => 'Порог DNS должен быть числом',
            'dns_time_threshold.min' => 'Порог DNS должен быть положительным числом',
            'connect_time_threshold.integer' => 'Порог соединения должен быть числом',
            'connect_time_threshold.min' => 'Порог соединения должен быть положительным числом',
            'ttfb_threshold.integer' => 'Порог TTFB должен быть числом',
            'ttfb_threshold.min' => 'Порог TTFB должен быть положительным числом',
            'response_time_threshold.integer' => 'Порог времени ответа должен быть числом',
            'response_time_threshold.min' => 'Порог времени ответа должен быть положительным числом',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors(),
            ], 422);
        }

        $monitor = Monitor::create(array_merge([
            'status' => 'unknown',
            'timeout' => 30,
            'interval' => 60,
            'is_active' => true,
        ], $validator->validated()));

        return response()->json([
            'message' => 'Монитор успешно создан',
            'monitor' => $monitor,
        ], 201);
    }

    public function show(Monitor $monitor)
    {
        return response()->json([
            'monitor' => $monitor,
        ]);
    }

    public function update(Request $request, Monitor $monitor)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'url' => 'sometimes|required|url|max:2048',
            'method' => ['sometimes', 'required', Rule::in(['GET', 'POST'])],
            'headers' => 'nullable|array',
            'headers.*' => 'string',
            'body' => 'nullable|string',
            'timeout' => 'nullable|integer|min:1|max:300',
            'interval' => 'nullable|integer|min:30|max:3600',
            'acceptable_status_codes' => 'nullable|array',
            'acceptable_status_codes.*' => 'string',
            'dns_time_threshold' => 'nullable|integer|min:0',
            'connect_time_threshold' => 'nullable|integer|min:0',
            'ttfb_threshold' => 'nullable|integer|min:0',
            'response_time_threshold' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ], [
            'name.required' => 'Укажите название монитора',
            'name.max' => 'Название не должно превышать 255 символов',
            'url.required' => 'Укажите URL для мониторинга',
            'url.url' => 'Укажите корректный URL',
            'url.max' => 'URL не должен превышать 2048 символов',
            'method.required' => 'Укажите HTTP метод',
            'method.in' => 'Метод должен быть GET или POST',
            'timeout.integer' => 'Таймаут должен быть числом',
            'timeout.min' => 'Таймаут должен быть не менее 1 секунды',
            'timeout.max' => 'Таймаут не должен превышать 300 секунд',
            'interval.integer' => 'Интервал должен быть числом',
            'interval.min' => 'Интервал должен быть не менее 30 секунд',
            'interval.max' => 'Интервал не должен превышать 3600 секунд',
            'dns_time_threshold.integer' => 'Порог DNS должен быть числом',
            'dns_time_threshold.min' => 'Порог DNS должен быть положительным числом',
            'connect_time_threshold.integer' => 'Порог соединения должен быть числом',
            'connect_time_threshold.min' => 'Порог соединения должен быть положительным числом',
            'ttfb_threshold.integer' => 'Порог TTFB должен быть числом',
            'ttfb_threshold.min' => 'Порог TTFB должен быть положительным числом',
            'response_time_threshold.integer' => 'Порог времени ответа должен быть числом',
            'response_time_threshold.min' => 'Порог времени ответа должен быть положительным числом',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors(),
            ], 422);
        }

        $monitor->update($validator->validated());

        return response()->json([
            'message' => 'Монитор успешно обновлён',
            'monitor' => $monitor->fresh(),
        ]);
    }

    public function destroy(Monitor $monitor)
    {
        $monitor->delete();

        return response()->json([
            'message' => 'Монитор успешно удалён',
        ]);
    }

    public function checks(Monitor $monitor)
    {
        $checks = $monitor->checks()
            ->orderBy('checked_at', 'desc')
            ->get();

        return response()->json([
            'checks' => $checks,
        ]);
    }

    public function metrics(Monitor $monitor, Request $request)
    {
        $period = $request->query('period', '24h');

        $startDate = match ($period) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => now()->subHours(24),
        };

        $checks = $monitor->checks()
            ->where('checked_at', '>=', $startDate)
            ->get();

        $totalChecks = $checks->count();
        $successfulChecks = $checks->where('status', 'success')->count();

        $uptime = $totalChecks > 0
            ? round(($successfulChecks / $totalChecks) * 100, 2)
            : 0;

        $avgResponseTime = $checks->where('response_time', '!=', null)->avg('response_time');
        $avgDnsTime = $checks->where('dns_time', '!=', null)->avg('dns_time');
        $avgConnectTime = $checks->where('connect_time', '!=', null)->avg('connect_time');
        $avgTtfb = $checks->where('ttfb', '!=', null)->avg('ttfb');

        return response()->json([
            'period' => $period,
            'uptime_percentage' => $uptime,
            'total_checks' => $totalChecks,
            'successful_checks' => $successfulChecks,
            'failed_checks' => $totalChecks - $successfulChecks,
            'avg_response_time' => $avgResponseTime ? round($avgResponseTime, 2) : null,
            'avg_dns_time' => $avgDnsTime ? round($avgDnsTime, 2) : null,
            'avg_connect_time' => $avgConnectTime ? round($avgConnectTime, 2) : null,
            'avg_ttfb' => $avgTtfb ? round($avgTtfb, 2) : null,
        ]);
    }

    public function checkNow(Monitor $monitor)
    {
        try {
            $previousStatus = $monitor->status;

            $check = $this->monitorService->checkMonitor($monitor);

            $monitor->refresh();
            $newStatus = $monitor->status;

            Log::info('Запущена ручная проверка', [
                'monitor_id' => $monitor->id,
                'monitor_name' => $monitor->name,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
            ]);

            $alertReasons = [];

            if (in_array($previousStatus, ['up', 'degraded']) && $newStatus === 'down') {
                $alertReasons[] = 'failure';
                Log::info('Обнаружен сбой монитора (ручная проверка)', [
                    'monitor_id' => $monitor->id,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                ]);
            }

            if (($previousStatus === 'down' && in_array($newStatus, ['up', 'degraded'])) ||
                ($previousStatus === 'degraded' && $newStatus === 'up')) {
                $alertReasons[] = 'recovery';
                Log::info('Монитор восстановлен (ручная проверка)', [
                    'monitor_id' => $monitor->id,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                ]);
            }

            if ($previousStatus === 'up' && $newStatus === 'degraded') {
                $alertReasons[] = 'threshold_breach';
                Log::info('Обнаружено превышение порогов (ручная проверка)', [
                    'monitor_id' => $monitor->id,
                    'transition' => 'up -> degraded',
                ]);
            }

            foreach ($alertReasons as $reason) {
                $alerts = $this->alertService->findTriggeredAlerts($monitor, $reason);
                foreach ($alerts as $alert) {
                    SendAlert::dispatch($alert, $monitor, $reason, $check->id);
                    Log::info('Запланирована отправка алерта (ручная проверка)', [
                        'alert_id' => $alert->id,
                        'alert_name' => $alert->name,
                        'monitor_id' => $monitor->id,
                        'reason' => $reason,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Проверка выполнена',
                'check' => $check,
                'monitor' => $monitor,
                'alerts_triggered' => count($alertReasons) > 0,
            ]);
        } catch (\Exception $e) {
            Log::error('Ошибка при выполнении ручной проверки', [
                'monitor_id' => $monitor->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Ошибка при выполнении проверки',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
