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
        Schema::create('monitor_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitor_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['success', 'failure', 'timeout', 'error']);
            $table->integer('status_code')->nullable();
            $table->integer('dns_time')->nullable();
            $table->integer('connect_time')->nullable();
            $table->integer('ttfb')->nullable();
            $table->integer('response_time')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('checked_at');
            $table->timestamps();

            $table->index('monitor_id');
            $table->index('checked_at');
            $table->index(['monitor_id', 'checked_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monitor_checks');
    }
};
