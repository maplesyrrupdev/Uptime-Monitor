import { z } from 'zod';

export const alertSchema = z.object({
  name: z
    .string()
    .min(1, 'Укажите название алерта')
    .max(255, 'Название не должно превышать 255 символов'),

  monitor_ids: z.array(z.number()),

  trigger_on: z
    .array(z.string())
    .min(1, 'Выберите хотя бы один триггер'),

  webhook_url: z
    .string()
    .min(1, 'Укажите URL вебхука')
    .url('Введите корректный URL')
    .max(500, 'URL не должен превышать 500 символов'),

  webhook_method: z.enum(['GET', 'POST'], {
    required_error: 'Укажите HTTP метод',
    invalid_type_error: 'Метод должен быть GET или POST',
  }),

  webhook_headers: z.any().transform((val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object' && !Array.isArray(val)) {
      return val as Record<string, string>;
    }
    return null;
  }),

  webhook_body: z.string().nullable(),

  is_active: z.boolean().default(true),
});

export type AlertFormData = z.infer<typeof alertSchema>;
