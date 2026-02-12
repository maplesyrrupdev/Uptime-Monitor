<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'alert_id',
        'monitor_id',
        'trigger_reason',
        'payload_sent',
        'response_status',
        'sent_at',
    ];

    protected $casts = [
        'payload_sent' => 'array',
        'sent_at' => 'datetime',
    ];

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(Monitor::class);
    }
}
