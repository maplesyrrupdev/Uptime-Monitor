<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Monitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'url',
        'method',
        'headers',
        'body',
        'timeout',
        'interval',
        'acceptable_status_codes',
        'dns_time_threshold',
        'connect_time_threshold',
        'ttfb_threshold',
        'response_time_threshold',
        'is_active',
        'status',
        'last_checked_at',
    ];

    protected $casts = [
        'headers' => 'array',
        'acceptable_status_codes' => 'array',
        'is_active' => 'boolean',
        'last_checked_at' => 'datetime',
        'dns_time_threshold' => 'integer',
        'connect_time_threshold' => 'integer',
        'ttfb_threshold' => 'integer',
        'response_time_threshold' => 'integer',
    ];

    public function checks(): HasMany
    {
        return $this->hasMany(MonitorCheck::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function latestCheck()
    {
        return $this->hasOne(MonitorCheck::class)->latestOfMany('checked_at');
    }
}
