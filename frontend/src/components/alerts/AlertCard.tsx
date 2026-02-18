import type { Alert } from '../../types/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

type AlertCardProps = {
  alert: Alert;
  onEdit: (alert: Alert) => void;
  onDelete: (alert: Alert) => void;
  onViewLogs: (alert: Alert) => void;
};

export function AlertCard({ alert, onEdit, onDelete, onViewLogs }: AlertCardProps) {
  const triggerLabels: Record<string, string> = {
    failure: 'Сбой',
    recovery: 'Восстановление',
    threshold_breach: 'Превышение порога',
  };

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{alert.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {alert.monitors && alert.monitors.length > 0 ? (
              <span>
                {alert.monitors.length === 1
                  ? alert.monitors[0].name
                  : `${alert.monitors.length} монитор${alert.monitors.length > 4 ? 'ов' : alert.monitors.length > 1 ? 'а' : ''}`}
              </span>
            ) : (
              'Все мониторы'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {alert.is_active ? (
            <Badge variant="success">Активен</Badge>
          ) : (
            <Badge variant="secondary">Неактивен</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {alert.trigger_on.map((trigger) => (
          <Badge key={trigger} variant="outline">
            {triggerLabels[trigger] || trigger}
          </Badge>
        ))}
      </div>

      <div className="text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Метод:</span>
          <span className="font-mono">{alert.webhook_method}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">URL:</span>
          <span className="font-mono text-xs truncate">{alert.webhook_url}</span>
        </div>
        {alert.webhook_headers && Object.keys(alert.webhook_headers).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Заголовки:</span>
            <span className="text-xs">{Object.keys(alert.webhook_headers).length} шт.</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewLogs(alert)}
        >
          Логи
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(alert)}
        >
          Изменить
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(alert)}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Удалить
        </Button>
      </div>
    </div>
  );
}
