<?php

namespace App\Http\Controllers;

use App\Models\Monitor;
use App\Models\MonitorCheck;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicController extends Controller
{
    public function stats()
    {
        $totalMonitors = Monitor::count();
        $upMonitors = Monitor::where('status', 'up')->count();
        $degradedMonitors = Monitor::where('status', 'degraded')->count();
        $downMonitors = Monitor::where('status', 'down')->count();

        $last24h = now()->subDay();
        $totalChecks = MonitorCheck::where('checked_at', '>=', $last24h)->count();
        $successfulChecks = MonitorCheck::where('checked_at', '>=', $last24h)
            ->where('status', 'success')
            ->count();

        $overallUptime = $totalChecks > 0 ? round(($successfulChecks / $totalChecks) * 100, 2) : 0;

        return response()->json([
            'total_monitors' => $totalMonitors,
            'up' => $upMonitors,
            'degraded' => $degradedMonitors,
            'down' => $downMonitors,
            'overall_uptime_24h' => $overallUptime,
        ]);
    }

    public function monitors()
    {
        $monitors = Monitor::with('latestCheck')
        ->select('id', 'name', 'status', 'interval', 'last_checked_at')
        ->orderBy('name')
        ->get()
        ->map(function ($monitor) {
            $latestCheck = $monitor->latestCheck;

            return [
                'id' => $monitor->id,
                'name' => $monitor->name,
                'status' => $monitor->status,
                'check_interval' => $monitor->interval,
                'last_checked_at' => $monitor->last_checked_at,
                'metrics' => $latestCheck ? [
                    'response_time' => $latestCheck->response_time,
                    'dns_time' => $latestCheck->dns_time,
                    'connect_time' => $latestCheck->connect_time,
                    'ttfb' => $latestCheck->ttfb,
                    'status_code' => $latestCheck->status_code,
                    'checked_at' => $latestCheck->checked_at,
                ] : null,
            ];
        });

        return response()->json($monitors);
    }

    public function monitor($id)
    {
        $monitor = Monitor::findOrFail($id);

        $recentChecks = $monitor->checks()
            ->select('id', 'monitor_id', 'status', 'response_time', 'dns_time', 'connect_time', 'ttfb', 'status_code', 'error_message', 'checked_at')
            ->orderBy('checked_at', 'desc')
            ->limit(100)
            ->get();

        $last24h = now()->subDay();
        $totalChecks24h = $monitor->checks()->where('checked_at', '>=', $last24h)->count();
        $successfulChecks24h = $monitor->checks()
            ->where('checked_at', '>=', $last24h)
            ->where('status', 'success')
            ->count();

        $uptime24h = $totalChecks24h > 0 ? round(($successfulChecks24h / $totalChecks24h) * 100, 2) : 0;

        $last7d = now()->subDays(7);
        $totalChecks7d = $monitor->checks()->where('checked_at', '>=', $last7d)->count();
        $successfulChecks7d = $monitor->checks()
            ->where('checked_at', '>=', $last7d)
            ->where('status', 'success')
            ->count();

        $uptime7d = $totalChecks7d > 0 ? round(($successfulChecks7d / $totalChecks7d) * 100, 2) : 0;

        $avgResponseTime = $monitor->checks()
            ->where('checked_at', '>=', $last24h)
            ->whereNotNull('response_time')
            ->avg('response_time');

        return response()->json([
            'id' => $monitor->id,
            'name' => $monitor->name,
            'status' => $monitor->status,
            'check_interval' => $monitor->interval,
            'last_checked_at' => $monitor->last_checked_at,
            'uptime_24h' => $uptime24h,
            'uptime_7d' => $uptime7d,
            'avg_response_time_24h' => $avgResponseTime ? round($avgResponseTime, 2) : null,
            'recent_checks' => $recentChecks,
        ]);
    }
}
