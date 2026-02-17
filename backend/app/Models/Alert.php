<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'monitor_id',
        'name',
        'webhook_url',
        'webhook_method',
        'webhook_headers',
        'webhook_body',
        'trigger_on',
        'is_active',
    ];

    protected $casts = [
        'webhook_headers' => 'array',
        'trigger_on' => 'array',
        'is_active' => 'boolean',
    ];

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(Monitor::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AlertLog::class);
    }
}
