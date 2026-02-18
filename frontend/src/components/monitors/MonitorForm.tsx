import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import type { Control, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Monitor } from '@/types/monitor';
import { monitorFormSchema } from '@/lib/validations/monitor';
import type { MonitorFormValues } from '@/lib/validations/monitor';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonitorFormProps {
  open: boolean;
  onClose: () => void;
  monitor: Monitor | null;
}

export function MonitorForm({ open, onClose, monitor }: MonitorFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const defaultValues = useMemo<MonitorFormValues>(() => ({
    name: monitor?.name || '',
    url: monitor?.url || '',
    method: monitor?.method || 'GET',
    headers: monitor?.headers || null,
    body: monitor?.body || null,
    timeout: monitor?.timeout || 30,
    interval: monitor?.interval || 60,
    acceptable_status_codes: monitor?.acceptable_status_codes || ['200'],
    dns_time_threshold: monitor?.dns_time_threshold || null,
    connect_time_threshold: monitor?.connect_time_threshold || null,
    ttfb_threshold: monitor?.ttfb_threshold || null,
    response_time_threshold: monitor?.response_time_threshold || null,
    is_active: monitor?.is_active ?? true,
  }), [monitor]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MonitorFormValues>({
    resolver: zodResolver(monitorFormSchema),
    defaultValues,
  });

  const method = watch('method');

  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setError(null);
      
      if (monitor?.headers && Object.keys(monitor.headers).length > 0) {
        setHeaders(Object.entries(monitor.headers).map(([key, value]) => ({ key, value })));
      } else {
        setHeaders([{ key: '', value: '' }]);
      }
    }
  }, [open, monitor, defaultValues, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: MonitorFormValues) => {
      const response = await api.post('/monitors', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      onClose();
    },
    onError: (err) => {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Ошибка при создании монитора');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MonitorFormValues) => {
      const response = await api.put(`/monitors/${monitor!.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      onClose();
    },
    onError: (err) => {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Ошибка при обновлении монитора');
    },
  });

  const onSubmit = async (data: MonitorFormValues) => {
    setError(null);

    const headersObj = headers.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      ...data,
      headers: Object.keys(headersObj).length > 0 ? headersObj : null,
    };

    if (monitor) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  return (
    <Dialog
      key={monitor?.id || 'new'}
      open={open}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {monitor ? 'Редактировать монитор' : 'Создать монитор'}
          </DialogTitle>
          <DialogDescription>
            {monitor
              ? 'Измените настройки монитора'
              : 'Добавьте новый монитор для отслеживания'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Основная информация</h3>

            <div className="space-y-2">
              <Label htmlFor="name">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Мой веб-сайт"
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                {...register('url')}
                placeholder="https://example.com"
                type="url"
                maxLength={2048}
              />
              {errors.url && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">
                HTTP метод <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="method"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.method && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.method.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Конфигурация запроса</h3>

            <div className="space-y-4">
              <Label>Заголовки</Label>
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

            {method === 'POST' && (
              <div className="space-y-2">
                <Label htmlFor="body">Тело запроса</Label>
                <Textarea
                  id="body"
                  {...register('body')}
                  placeholder='{"key": "value"}'
                  rows={4}
                />
                {errors.body && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.body.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Таймеры</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">
                  Таймаут (секунды) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="timeout"
                  type="number"
                  {...register('timeout', { valueAsNumber: true })}
                  min={1}
                  max={300}
                />
                {errors.timeout && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.timeout.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">
                  Интервал (секунды) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="interval"
                  type="number"
                  {...register('interval', { valueAsNumber: true })}
                  min={30}
                  max={3600}
                />
                {errors.interval && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.interval.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Ожидаемый ответ</h3>

            <StatusCodesField control={control} errors={errors} initialValue={monitor?.acceptable_status_codes || ['200']} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">
              Пороговые значения (миллисекунды)
            </h3>
            <p className="text-sm text-muted-foreground">
              Опционально: монитор будет помечен как «замедлен», если
              превышены пороги
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dns_time_threshold">Порог DNS</Label>
                <Input
                  id="dns_time_threshold"
                  type="number"
                  {...register('dns_time_threshold', {
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined) return null;
                      const num = Number(v);
                      return isNaN(num) ? null : num;
                    },
                  })}
                  min={0}
                  placeholder="Например, 100"
                />
                {errors.dns_time_threshold && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.dns_time_threshold.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="connect_time_threshold">
                  Порог соединения
                </Label>
                <Input
                  id="connect_time_threshold"
                  type="number"
                  {...register('connect_time_threshold', {
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined) return null;
                      const num = Number(v);
                      return isNaN(num) ? null : num;
                    },
                  })}
                  min={0}
                  placeholder="Например, 200"
                />
                {errors.connect_time_threshold && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.connect_time_threshold.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttfb_threshold">Порог TTFB</Label>
                <Input
                  id="ttfb_threshold"
                  type="number"
                  {...register('ttfb_threshold', {
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined) return null;
                      const num = Number(v);
                      return isNaN(num) ? null : num;
                    },
                  })}
                  min={0}
                  placeholder="Например, 500"
                />
                {errors.ttfb_threshold && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.ttfb_threshold.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="response_time_threshold">
                  Порог времени ответа
                </Label>
                <Input
                  id="response_time_threshold"
                  type="number"
                  {...register('response_time_threshold', {
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined) return null;
                      const num = Number(v);
                      return isNaN(num) ? null : num;
                    },
                  })}
                  min={0}
                  placeholder="Например, 1000"
                />
                {errors.response_time_threshold && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.response_time_threshold.message}
                  </p>
                )}
              </div>
            </div>
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
                Монитор активен
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Неактивные мониторы не проверяются автоматически
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Сохранение...'
                : monitor
                  ? 'Сохранить'
                  : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusCodesField({ control, errors, initialValue }: { control: Control<MonitorFormValues>; errors: FieldErrors<MonitorFormValues>; initialValue: string[] }) {
  const [statusCodesText, setStatusCodesText] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusCodesText(initialValue?.length > 0 ? initialValue.join(', ') : '');
  }, [initialValue]);

  const parseStatusCodes = (value: string) => {
    const codes = value
      .split(',')
      .map((code) => code.trim())
      .filter((code) => code !== '');

    return codes.length > 0 ? codes : ['200'];
  };

  return (
    <Controller
      name="acceptable_status_codes"
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <Label htmlFor="status_codes">
            Допустимые коды состояния <span className="text-red-500">*</span>
          </Label>
          <Input
            id="status_codes"
            value={statusCodesText}
            onChange={(e) => {
              setStatusCodesText(e.target.value);
              const parsed = parseStatusCodes(e.target.value);
              field.onChange(parsed);
            }}
            placeholder="200, 201, 2xx, 3xx"
          />
          {errors.acceptable_status_codes && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.acceptable_status_codes.message}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Разделите коды запятыми. Можно использовать диапазоны (например, 2xx)
          </p>
        </div>
      )}
    />
  );
}
