import type { Monitor } from '@/types/monitor';
import { PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

interface MonitorCardProps {
  monitor: Monitor;
  onEdit: (monitor: Monitor) => void;
  onDelete: (monitor: Monitor) => void;
  onCheckNow: (monitor: Monitor) => void;
  isCheckingNow?: boolean;
}

const statusColors = {
  up: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  degraded:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  down: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const statusLabels = {
  up: 'Работает',
  degraded: 'Замедлен',
  down: 'Недоступен',
  unknown: 'Неизвестно',
};

export function MonitorCard({
  monitor,
  onEdit,
  onDelete,
  onCheckNow,
  isCheckingNow = false,
}: MonitorCardProps) {
  const formatLastChecked = (dateString: string | null) => {
    if (!dateString) return 'Никогда';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн назад`;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{monitor.name}</CardTitle>
          <Badge
            className={statusColors[monitor.status]}
            variant="outline"
          >
            {statusLabels[monitor.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">URL: </span>
            <span className="break-all">{monitor.url}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Метод: </span>
            <span>{monitor.method}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Интервал: </span>
            <span>{monitor.interval}с</span>
          </div>
          <div>
            <span className="text-muted-foreground">Последняя проверка: </span>
            <span>{formatLastChecked(monitor.last_checked_at)}</span>
          </div>
          {!monitor.is_active && (
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
              <PauseCircle className="h-4 w-4" />
              Приостановлен
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 mt-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(monitor)}
        >
          Изменить
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCheckNow(monitor)}
          disabled={isCheckingNow}
        >
          {isCheckingNow ? 'Проверка...' : 'Проверить сейчас'}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(monitor)}
        >
          Удалить
        </Button>
      </CardFooter>
    </Card>
  );
}
