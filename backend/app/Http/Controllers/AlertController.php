<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\AlertLog;
use App\Models\Monitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AlertController extends Controller
{
    public function index()
    {
        $alerts = Alert::with('monitor:id,name,url')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($alerts);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'monitor_id' => 'nullable|exists:monitors,id',
            'name' => 'required|string|max:255',
            'webhook_url' => 'required|url|max:500',
            'method' => 'required|in:GET,POST',
            'headers' => 'nullable|array',
            'body' => 'required|string',
            'trigger_on' => 'required|array',
            'trigger_on.*' => 'in:failure,recovery,threshold_breach',
            'is_active' => 'boolean',
        ], [
            'monitor_id.exists' => 'Указанный монитор не найден',
            'name.required' => 'Укажите название алерта',
            'webhook_url.required' => 'Укажите URL вебхука',
            'webhook_url.url' => 'Укажите корректный URL',
            'method.required' => 'Укажите HTTP метод',
            'method.in' => 'Метод должен быть GET или POST',
            'body.required' => 'Укажите тело запроса',
            'trigger_on.required' => 'Выберите хотя бы один триггер',
            'trigger_on.*.in' => 'Неверный триггер алерта',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors(),
            ], 422);
        }

        $alert = Alert::create([
            'monitor_id' => $request->monitor_id,
            'name' => $request->name,
            'webhook_url' => $request->webhook_url,
            'method' => $request->method,
            'headers' => $request->headers ?? [],
            'body' => $request->body,
            'trigger_on' => $request->trigger_on,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'message' => 'Алерт успешно создан',
            'alert' => $alert->load('monitor:id,name,url'),
        ], 201);
    }

    public function show($id)
    {
        $alert = Alert::with('monitor:id,name,url')->find($id);

        if (!$alert) {
            return response()->json([
                'message' => 'Алерт не найден',
            ], 404);
        }

        return response()->json($alert);
    }

    public function update(Request $request, $id)
    {
        $alert = Alert::find($id);

        if (!$alert) {
            return response()->json([
                'message' => 'Алерт не найден',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'monitor_id' => 'nullable|exists:monitors,id',
            'name' => 'sometimes|required|string|max:255',
            'webhook_url' => 'sometimes|required|url|max:500',
            'method' => 'sometimes|required|in:GET,POST',
            'headers' => 'nullable|array',
            'body' => 'sometimes|required|string',
            'trigger_on' => 'sometimes|required|array',
            'trigger_on.*' => 'in:failure,recovery,threshold_breach',
            'is_active' => 'boolean',
        ], [
            'monitor_id.exists' => 'Указанный монитор не найден',
            'name.required' => 'Укажите название алерта',
            'webhook_url.required' => 'Укажите URL вебхука',
            'webhook_url.url' => 'Укажите корректный URL',
            'method.required' => 'Укажите HTTP метод',
            'method.in' => 'Метод должен быть GET или POST',
            'body.required' => 'Укажите тело запроса',
            'trigger_on.required' => 'Выберите хотя бы один триггер',
            'trigger_on.*.in' => 'Неверный триггер алерта',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors(),
            ], 422);
        }

        $alert->update($request->only([
            'monitor_id',
            'name',
            'webhook_url',
            'method',
            'headers',
            'body',
            'trigger_on',
            'is_active',
        ]));

        return response()->json([
            'message' => 'Алерт успешно обновлен',
            'alert' => $alert->load('monitor:id,name,url'),
        ]);
    }

    public function destroy($id)
    {
        $alert = Alert::find($id);

        if (!$alert) {
            return response()->json([
                'message' => 'Алерт не найден',
            ], 404);
        }

        $alert->delete();

        return response()->json([
            'message' => 'Алерт успешно удален',
        ]);
    }

    public function logs($id)
    {
        $alert = Alert::find($id);

        if (!$alert) {
            return response()->json([
                'message' => 'Алерт не найден',
            ], 404);
        }

        $logs = AlertLog::where('alert_id', $id)
            ->with('monitor:id,name,url')
            ->orderBy('sent_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }
}
