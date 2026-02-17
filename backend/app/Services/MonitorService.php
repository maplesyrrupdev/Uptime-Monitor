<?php

namespace App\Services;

use App\Models\Monitor;
use App\Models\MonitorCheck;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\TransferStats;
use Illuminate\Support\Facades\Log;

class MonitorService
{
    public function checkMonitor(Monitor $monitor): MonitorCheck
    {
        $metrics = [
            'dns_time' => null,
            'connect_time' => null,
            'ttfb' => null,
            'response_time' => null,
        ];

        $status = 'error';
        $statusCode = null;
        $errorMessage = null;

        try {
            $client = new Client([
                'timeout' => $monitor->timeout,
                'connect_timeout' => $monitor->timeout,
                'http_errors' => false,
            ]);

            $options = [
                'headers' => $monitor->headers ?? [],
                'on_stats' => function (TransferStats $stats) use (&$metrics) {
                    if ($stats->hasResponse()) {
                        $handlerStats = $stats->getHandlerStats();

                        $metrics['dns_time'] = isset($handlerStats['namelookup_time'])
                            ? (int) round($handlerStats['namelookup_time'] * 1000)
                            : null;

                        $metrics['connect_time'] = isset($handlerStats['connect_time'])
                            ? (int) round($handlerStats['connect_time'] * 1000)
                            : null;

                        $metrics['ttfb'] = isset($handlerStats['starttransfer_time'])
                            ? (int) round($handlerStats['starttransfer_time'] * 1000)
                            : null;

                        $metrics['response_time'] = isset($handlerStats['total_time'])
                            ? (int) round($handlerStats['total_time'] * 1000)
                            : null;
                    }
                }
            ];

            if ($monitor->method === 'POST' && $monitor->body) {
                $options['body'] = $monitor->body;
            }

            $response = $client->request($monitor->method, $monitor->url, $options);
            $statusCode = $response->getStatusCode();

            if ($this->isAcceptableStatusCode($statusCode, $monitor->acceptable_status_codes)) {
                if ($this->checkThresholds($metrics, $monitor)) {
                    $status = 'success';
                } else {
                    $status = 'success_degraded';
                }
            } else {
                $status = 'failure';
                $errorMessage = "Недопустимый код статуса: {$statusCode}";
            }

        } catch (ConnectException $e) {
            $status = 'timeout';
            $errorMessage = 'Не удалось подключиться к хосту: ' . $e->getMessage();
        } catch (RequestException $e) {
            $status = 'error';
            $errorMessage = 'Ошибка запроса: ' . $e->getMessage();

            if ($e->hasResponse()) {
                $statusCode = $e->getResponse()->getStatusCode();
            }
        } catch (\Exception $e) {
            $status = 'error';
            $errorMessage = 'Неизвестная ошибка: ' . $e->getMessage();
            Log::error('Monitor check failed', [
                'monitor_id' => $monitor->id,
                'error' => $e->getMessage(),
            ]);
        }

        $check = MonitorCheck::create([
            'monitor_id' => $monitor->id,
            'status' => $status,
            'status_code' => $statusCode,
            'dns_time' => $metrics['dns_time'],
            'connect_time' => $metrics['connect_time'],
            'ttfb' => $metrics['ttfb'],
            'response_time' => $metrics['response_time'],
            'error_message' => $errorMessage,
            'checked_at' => now(),
        ]);

        $previousStatus = $monitor->status;

        if ($status === 'success') {
            $newStatus = 'up';
        } elseif ($status === 'success_degraded') {
            $newStatus = 'degraded';
        } else {
            $newStatus = 'down';
        }

        $monitor->update([
            'status' => $newStatus,
            'last_checked_at' => now(),
        ]);

        return $check;
    }

    private function isAcceptableStatusCode(int $statusCode, ?array $acceptableCodes): bool
    {
        if (empty($acceptableCodes)) {
            // по умолчанию считаем допустимыми коды 2xx
            return $statusCode >= 200 && $statusCode < 300;
        }

        foreach ($acceptableCodes as $code) {
            if (is_numeric($code)) {
                if ((int) $code === $statusCode) {
                    return true;
                }
            } elseif (is_string($code) && str_ends_with($code, 'xx')) {
                // обработка диапазонов типа "2xx", "3xx"
                $prefix = (int) substr($code, 0, 1);
                if ((int) floor($statusCode / 100) === $prefix) {
                    return true;
                }
            }
        }

        return false;
    }

    private function checkThresholds(array $metrics, Monitor $monitor): bool
    {
        if ($monitor->dns_time_threshold && $metrics['dns_time'] > $monitor->dns_time_threshold) {
            return false;
        }

        if ($monitor->connect_time_threshold && $metrics['connect_time'] > $monitor->connect_time_threshold) {
            return false;
        }

        if ($monitor->ttfb_threshold && $metrics['ttfb'] > $monitor->ttfb_threshold) {
            return false;
        }

        if ($monitor->response_time_threshold && $metrics['response_time'] > $monitor->response_time_threshold) {
            return false;
        }

        return true;
    }
}
