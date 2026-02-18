import { useState } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Alert } from '../../types/alert';
import { alertSchema, type AlertFormData } from '../../lib/validations/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { DialogFooter } from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type AlertFormProps = {
  alert?: Alert;
  monitors: Array<{ id: number; name: string }>;
  onSubmit: (data: AlertFormData) => void;
  onCancel: () => void;
  error?: string | null;
  isSubmitting?: boolean;
};

const TRIGGERS = [
  { value: 'failure', label: 'Сбой' },
  { value: 'recovery', label: 'Восстановление' },
  { value: 'threshold_breach', label: 'Превышение порога' },
];

const TEMPLATE_VARIABLES = [
  { var: '{name}', desc: 'Имя монитора' },
  { var: '{url}', desc: 'URL монитора' },
  { var: '{status}', desc: 'Статус (up/degraded/down)' },
  { var: '{response_time}', desc: 'Время ответа (мс)' },
  { var: '{dns_time}', desc: 'Время DNS (мс)' },
  { var: '{connect_time}', desc: 'Время подключения (мс)' },
  { var: '{ttfb}', desc: 'Время до первого байта (мс)' },
  { var: '{status_code}', desc: 'HTTP код ответа' },
  { var: '{error_message}', desc: 'Сообщение об ошибке' },
  { var: '{timestamp}', desc: 'Временная метка' },
];

export function AlertForm({ alert, monitors, onSubmit, onCancel, error, isSubmitting }: AlertFormProps) {
  const initialHeaders = alert?.webhook_headers
    ? Object.entries(alert.webhook_headers).map(([key, value]) => ({ key, value }))
    : [];
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    initialHeaders.length > 0 ? initialHeaders : [{ key: '', value: '' }]
  );
  const [isGlobalAlert, setIsGlobalAlert] = useState<boolean>(
    !alert || !alert.monitors || alert.monitors.length === 0
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: alert
      ? {
          name: alert.name,
          monitor_ids: alert.monitors ? alert.monitors.map(m => m.id) : [],
          trigger_on: alert.trigger_on,
          webhook_url: alert.webhook_url,
          webhook_method: alert.webhook_method,
          webhook_headers: alert.webhook_headers || {},
          webhook_body: alert.webhook_body || '',
          is_active: alert.is_active,
        }
      : {
          name: '',
          monitor_ids: [],
          trigger_on: [],
          webhook_url: '',
          webhook_method: 'POST',
          webhook_headers: {},
          webhook_body: '',
          is_active: true,
        },
  });

  const webhookMethod = watch('webhook_method');

  const onFormSubmit = (data: AlertFormData) => {
    const headersObj = headers.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    onSubmit({
      ...data,
      webhook_headers: headersObj,
      webhook_body: data.webhook_method === 'POST' ? data.webhook_body : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Основная информация</h3>
        
        <div className="space-y-2">
          <Label htmlFor="name">Имя <span className="text-red-500">*</span></Label>
          <Input id="name" {...register('name')} placeholder="Например, Алерт для продакшена" />
          {errors.name && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Мониторы</Label>
          <div className="space-y-2 mt-2">
            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-md bg-muted">
              <input
                type="checkbox"
                checked={isGlobalAlert}
                onChange={(e) => {
                  setIsGlobalAlert(e.target.checked);
                  if (e.target.checked) {
                    setValue('monitor_ids', []);
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Все мониторы (глобальный)</span>
            </label>

            {!isGlobalAlert && (
              <Controller
                name="monitor_ids"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2 pl-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {monitors.map((monitor) => (
                      <label key={monitor.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value.includes(monitor.id)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...field.value, monitor.id]
                              : field.value.filter((id) => id !== monitor.id);
                            field.onChange(newValue);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{monitor.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
            )}
          </div>
          {errors.monitor_ids && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.monitor_ids.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Триггеры <span className="text-red-500">*</span></Label>
          <Controller
            name="trigger_on"
            control={control}
            render={({ field }) => (
              <div className="space-y-2 mt-2">
                {TRIGGERS.map((trigger) => (
                  <label key={trigger.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value.includes(trigger.value)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...field.value, trigger.value]
                          : field.value.filter((v) => v !== trigger.value);
                        field.onChange(newValue);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{trigger.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.trigger_on && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.trigger_on.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Конфигурация Webhook</h3>

        <div className="space-y-2">
          <Label htmlFor="webhook_url">Webhook URL <span className="text-red-500">*</span></Label>
          <Input id="webhook_url" {...register('webhook_url')} placeholder="https://api.example.com/webhook" />
          {errors.webhook_url && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.webhook_url.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook_method">HTTP Метод <span className="text-red-500">*</span></Label>
          <Controller
            name="webhook_method"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите метод" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.webhook_method && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.webhook_method.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Label>Заголовки (опционально)</Label>
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Ключ"
                  value={header.key}
                  onChange={(e) => {
                    const newHeaders = [...headers];
                    newHeaders[index].key = e.target.value;
                    setHeaders(newHeaders);
                  }}
                  className="flex-1"
                />
                <Input
                  placeholder="Значение"
                  value={header.value}
                  onChange={(e) => {
                    const newHeaders = [...headers];
                    newHeaders[index].value = e.target.value;
                    setHeaders(newHeaders);
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newHeaders = headers.filter((_, i) => i !== index);
                    setHeaders(newHeaders.length ? newHeaders : [{ key: '', value: '' }]);
                  }}
                  className="shrink-0"
                  disabled={headers.length === 1 && !headers[0].key && !headers[0].value}
                >
                  <span className="sr-only">Удалить</span>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHeaders([...headers, { key: '', value: '' }])}
              className="mt-2"
            >
              + Добавить заголовок
            </Button>
          </div>
        </div>

        {webhookMethod === 'POST' && (
          <div className="space-y-2">
            <Label htmlFor="webhook_body">Тело запроса <span className="text-red-500">*</span></Label>
            <Textarea
              id="webhook_body"
              {...register('webhook_body')}
              rows={6}
              className="font-mono text-sm"
              placeholder='{"text": "Монитор {name} сменил статус на {status}"}'
            />
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-xs font-semibold mb-2">Доступные переменные:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {TEMPLATE_VARIABLES.map((v) => (
                  <div key={v.var}>
                    <code className="text-primary">{v.var}</code> - {v.desc}
                  </div>
                ))}
              </div>
            </div>
            {errors.webhook_body && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.webhook_body.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            {...register('is_active')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_active" className="font-normal cursor-pointer">
            Алерт активен
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Неактивные алерты не отправляют уведомления
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Сохранение...'
            : alert
            ? 'Обновить'
            : 'Создать'}
        </Button>
      </DialogFooter>
    </form>
  );
}
