<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE monitor_checks DROP CONSTRAINT IF EXISTS monitor_checks_status_check");

        DB::statement("ALTER TABLE monitor_checks ADD CONSTRAINT monitor_checks_status_check CHECK (status IN ('success', 'success_degraded', 'failure', 'timeout', 'error'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE monitor_checks DROP CONSTRAINT IF EXISTS monitor_checks_status_check");

        DB::statement("ALTER TABLE monitor_checks ADD CONSTRAINT monitor_checks_status_check CHECK (status IN ('success', 'failure', 'timeout', 'error'))");
    }
};
