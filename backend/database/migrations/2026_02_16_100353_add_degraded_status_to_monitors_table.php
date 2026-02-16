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
        DB::statement('ALTER TABLE monitors DROP CONSTRAINT IF EXISTS monitors_status_check');

        DB::statement("ALTER TABLE monitors ADD CONSTRAINT monitors_status_check CHECK (status IN ('up', 'down', 'unknown', 'degraded'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE monitors SET status = 'unknown' WHERE status = 'degraded'");

        DB::statement('ALTER TABLE monitors DROP CONSTRAINT IF EXISTS monitors_status_check');
        DB::statement("ALTER TABLE monitors ADD CONSTRAINT monitors_status_check CHECK (status IN ('up', 'down', 'unknown'))");
    }
};
