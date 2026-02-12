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
        Schema::create('monitors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('url');
            $table->enum('method', ['GET', 'POST'])->default('GET');
            $table->json('headers')->nullable();
            $table->text('body')->nullable();
            $table->integer('timeout')->default(30);
            $table->integer('interval')->default(60);
            $table->json('acceptable_status_codes')->default('["200", "2xx"]');

            $table->integer('dns_time_threshold')->nullable();
            $table->integer('connect_time_threshold')->nullable();
            $table->integer('ttfb_threshold')->nullable();
            $table->integer('response_time_threshold')->nullable();

            $table->boolean('is_active')->default(true);
            $table->enum('status', ['up', 'down', 'unknown'])->default('unknown');
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monitors');
    }
};
