<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MonitorController;
use App\Http\Controllers\SetupController;
use App\Http\Middleware\EnsureSetupCompleted;
use Illuminate\Support\Facades\Route;

Route::prefix('setup')->group(function () {
    Route::get('/status', [SetupController::class, 'status']);
    Route::post('/admin', [SetupController::class, 'createAdmin']);
});

Route::middleware([EnsureSetupCompleted::class])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::apiResource('monitors', MonitorController::class);
        Route::get('/monitors/{monitor}/checks', [MonitorController::class, 'checks']);
        Route::get('/monitors/{monitor}/metrics', [MonitorController::class, 'metrics']);
        Route::post('/monitors/{monitor}/check-now', [MonitorController::class, 'checkNow']);

        Route::apiResource('alerts', AlertController::class);
        Route::get('/alerts/{alert}/logs', [AlertController::class, 'logs']);
    });
});
