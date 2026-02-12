<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitorCheck extends Model
{
    use HasFactory;

    protected $fillable = [
        'monitor_id',
        'status',
        'status_code',
        'dns_time',
        'connect_time',
        'ttfb',
        'response_time',
        'error_message',
        'checked_at',
    ];

    protected $casts = [
        'checked_at' => 'datetime',
        'dns_time' => 'integer',
        'connect_time' => 'integer',
        'ttfb' => 'integer',
        'response_time' => 'integer',
    ];

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(Monitor::class);
    }
}
