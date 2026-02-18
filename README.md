# Uptime Monitor

Инструмент для мониторинга доступности и производительности HTTP-эндпоинтов, созданный в рамках практики в WebCanape.

## Функционал

- Отслеживание доступности ресурсов, DNS-времени, времени соединения, TTFB и общего времени ответа
- Webhook-алерты при сбое, восстановлении и превышении порогов, кастомные заголовки, шаблонные переменные в теле запроса
- Публичный дашборд с текущим статусом и историей аптайма

## Стек

- Laravel 12
- PHP 8.5
- PostgreSQL 16
- Redis 7
- React 19
- Vite
- shadcn/ui
- Docker Compose

---

## Запуск

**Для запуска нужны Docker и Docker Compose.**

Сначала переименуйте .env.example в .env и измените настройки на необходимые. Далее:

```bash
git clone https://github.com/maplesyrrupdev/Uptime-Monitor.git
cd Uptime-Monitor-main
docker-compose up -d
```

Сервис будет доступен по адресу http://localhost:3000
