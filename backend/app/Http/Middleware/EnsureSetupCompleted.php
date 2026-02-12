<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSetupCompleted
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!User::exists()) {
            return response()->json([
                'message' => 'Необходимо завершить настройку приложения.',
            ], 403);
        }

        return $next($request);
    }
}
