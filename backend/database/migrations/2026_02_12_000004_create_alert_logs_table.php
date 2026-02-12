<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alert_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained()->onDelete('cascade');
            $table->foreignId('monitor_id')->constrained()->onDelete('cascade');
            $table->string('trigger_reason');
            $table->json('payload_sent');
            $table->integer('response_status')->nullable();
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index('alert_id');
            $table->index('monitor_id');
            $table->index('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alert_logs');
    }
};
