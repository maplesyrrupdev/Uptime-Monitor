import { z } from 'zod';

export const monitorFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Укажите название монитора')
        .max(255, 'Название не должно превышать 255 символов'),

    url: z
        .string()
        .min(1, 'Укажите URL для мониторинга')
        .url('Укажите корректный URL')
        .max(2048, 'URL не должен превышать 2048 символов'),

    method: z.enum(['GET', 'POST'], {
        required_error: 'Укажите HTTP метод',
        invalid_type_error: 'Метод должен быть GET или POST',
    }),

    headers: z.any().transform((val) => {
    if (val === null || val === undefined) return null;
        if (typeof val === 'object' && !Array.isArray(val)) {
            return val as Record<string, string>;
        }
        return null;
    }),

    body: z.string().nullish(),

    timeout: z.number({
        error: (issue) => issue.input === undefined || issue.input === null ? "Укажите таймаут" : "Таймаут должен быть числом"
    }).min(1, "Таймаут должен быть не менее 1 секунды").max(300, "Таймаут не должен превышать 300 секунд"),

    interval: z.number({
        error: (issue) => issue.input === undefined || issue.input === null ? "Укажите интервал" : "Интервал должен быть числом"
    }).min(1, "Интервал должен быть не менее 30 секунд").max(300, "Интервал не должен превышать 3600 секунд"),

    acceptable_status_codes: z
        .array(z.string())
        .min(1, 'Укажите хотя бы один допустимый код состояния')
        .default(['200']),

    dns_time_threshold: z
        .number({
            error: 'Порог DNS должен быть числом',
        })
        .min(0, 'Порог DNS не может быть отрицательным')
        .nullish(),

    connect_time_threshold: z
    .number({
        error: 'Порог соединения должен быть числом',
    })
    .min(0, 'Порог соединения не может быть отрицательным')
    .nullish(),

    ttfb_threshold: z
        .number({
            error: 'Порог TTFB должен быть числом',
        })
        .min(0, 'Порог TTFB не может быть отрицательным')
        .nullish(),

    response_time_threshold: z
        .number({
            error: 'Порог времени ответа должен быть числом',
        })
        .min(0, 'Порог времени ответа не может быть отрицательным')
        .nullish(),

    is_active: z.boolean().default(true),
});

export type MonitorFormValues = z.infer<typeof monitorFormSchema>;
