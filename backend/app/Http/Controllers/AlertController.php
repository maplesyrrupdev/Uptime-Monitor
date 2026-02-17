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
        $alerts = Alert::with('monitors:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'alerts' => $alerts,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'monitor_ids' => 'nullable|array',
            'monitor_ids.*' => 'exists:monitors,id',
            'name' => 'required|string|max:255',
            'webhook_url' => 'required|url|max:500',
            'webhook_method' => 'required|in:GET,POST',
            'webhook_headers' => 'nullable|array',
            'webhook_body' => 'required_if:webhook_method,POST|nullable|string',
            'trigger_on' => 'required|array',
            'trigger_on.*' => 'in:failure,recovery,threshold_breach',
            'is_active' => 'boolean',
        ], [
            'monitor_ids.*.exists' => 'Указанный монитор не найден',
            'name.required' => 'Укажите название алерта',
            'webhook_url.required' => 'Укажите URL вебхука',
            'webhook_url.url' => 'Укажите корректный URL',
            'webhook_method.required' => 'Укажите HTTP метод',
            'webhook_method.in' => 'Метод должен быть GET или POST',
            'webhook_body.required_if' => 'Укажите тело запроса для POST метода',
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
            'name' => $request->name,
            'webhook_url' => $request->webhook_url,
            'webhook_method' => $request->webhook_method,
            'webhook_headers' => $request->webhook_headers ?? [],
            'webhook_body' => $request->webhook_body,
            'trigger_on' => $request->trigger_on,
            'is_active' => $request->is_active ?? true,
        ]);

        if ($request->has('monitor_ids') && is_array($request->monitor_ids) && !empty($request->monitor_ids)) {
            $alert->monitors()->sync($request->monitor_ids);
        }

        return response()->json([
            'message' => 'Алерт успешно создан',
            'alert' => $alert->load('monitors:id,name'),
        ], 201);
    }

    public function show($id)
    {
        $alert = Alert::with('monitors:id,name')->find($id);

        if (!$alert) {
            return response()->json([
                'message' => 'Алерт не найден',
            ], 404);
        }

        return response()->json([
            'alert' => $alert,
        ]);
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
            'monitor_ids' => 'nullable|array',
            'monitor_ids.*' => 'exists:monitors,id',
            'name' => 'sometimes|required|string|max:255',
            'webhook_url' => 'sometimes|required|url|max:500',
            'webhook_method' => 'sometimes|required|in:GET,POST',
            'webhook_headers' => 'nullable|array',
            'webhook_body' => 'required_if:webhook_method,POST|nullable|string',
            'trigger_on' => 'sometimes|required|array',
            'trigger_on.*' => 'in:failure,recovery,threshold_breach',
            'is_active' => 'boolean',
        ], [
            'monitor_ids.*.exists' => 'Указанный монитор не найден',
            'name.required' => 'Укажите название алерта',
            'webhook_url.required' => 'Укажите URL вебхука',
            'webhook_url.url' => 'Укажите корректный URL',
            'webhook_method.required' => 'Укажите HTTP метод',
            'webhook_method.in' => 'Метод должен быть GET или POST',
            'webhook_body.required_if' => 'Укажите тело запроса для POST метода',
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
            'name',
            'webhook_url',
            'webhook_method',
            'webhook_headers',
            'webhook_body',
            'trigger_on',
            'is_active',
        ]));

        if ($request->has('monitor_ids')) {
            if (is_array($request->monitor_ids) && !empty($request->monitor_ids)) {
                $alert->monitors()->sync($request->monitor_ids);
            } else {
                $alert->monitors()->detach();
            }
        }

        return response()->json([
            'message' => 'Алерт успешно обновлен',
            'alert' => $alert->load('monitors:id,name'),
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
