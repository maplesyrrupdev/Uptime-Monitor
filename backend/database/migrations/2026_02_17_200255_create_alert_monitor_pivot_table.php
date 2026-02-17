<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alert_monitor', function (Blueprint $table) {
            $table->foreignId('alert_id')->constrained()->onDelete('cascade');
            $table->foreignId('monitor_id')->constrained()->onDelete('cascade');
            $table->primary(['alert_id', 'monitor_id']);
        });

        DB::statement('
            INSERT INTO alert_monitor (alert_id, monitor_id)
            SELECT id, monitor_id FROM alerts WHERE monitor_id IS NOT NULL
        ');

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropForeign(['monitor_id']);
            $table->dropColumn('monitor_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->foreignId('monitor_id')->nullable()->constrained()->onDelete('cascade');
        });

        DB::statement('
            UPDATE alerts a
            SET monitor_id = (
                SELECT monitor_id FROM alert_monitor
                WHERE alert_id = a.id
                LIMIT 1
            )
        ');

        Schema::dropIfExists('alert_monitor');
    }
};
