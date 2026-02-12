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
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitor_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('webhook_url');
            $table->enum('method', ['GET', 'POST'])->default('POST');
            $table->json('headers')->nullable();
            $table->text('body')->nullable();
            $table->json('trigger_on')->default('["failure", "recovery"]');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
