<?php

namespace App\Http\Controllers;

use App\Models\Monitor;
use App\Services\MonitorService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MonitorController extends Controller
{
    public function __construct(
        private MonitorService $monitorService
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
        $validated = $request->validate([
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
        ]);

        $monitor = Monitor::create(array_merge([
            'status' => 'unknown',
            'timeout' => 30,
            'interval' => 60,
            'is_active' => true,
        ], $validated));

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
        $validated = $request->validate([
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
        ]);

        $monitor->update($validated);

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
            ->paginate(100);

        return response()->json($checks);
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
            $check = $this->monitorService->checkMonitor($monitor);

            return response()->json([
                'message' => 'Проверка выполнена',
                'check' => $check,
                'monitor' => $monitor->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Ошибка при выполнении проверки',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
