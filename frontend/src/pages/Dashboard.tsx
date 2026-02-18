import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { MonitorForm } from '@/components/monitors/MonitorForm';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Monitor } from '@/types/monitor';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoaderCircle, ArrowUp, ArrowDown, ArrowLeft, AlertTriangle, Clock, Activity, Edit, Trash2, RefreshCw, type LucideIcon } from 'lucide-react';
import type { MonitorCheck } from '@/types/monitor';

interface Stats {
  total_monitors: number;
  up: number;
  degraded: number;
  down: number;
  overall_uptime_24h: number;
}

interface PublicMonitor {
  id: number;
  name: string;
  status: 'up' | 'degraded' | 'down' | 'unknown';
  check_interval: number;
  last_checked_at: string | null;
  metrics: {
    response_time: number;
    dns_time: number;
    connect_time: number;
    ttfb: number;
    status_code: number;
    checked_at: string;
  } | null;
}

interface MonitorDetail extends PublicMonitor {
  uptime_24h: number;
  uptime_7d: number;
  avg_response_time_24h: number | null;
  recent_checks: Array<{
    id: number;
    status: string;
    response_time: number | null;
    dns_time: number | null;
    connect_time: number | null;
    ttfb: number | null;
    status_code: number | null;
    error_message: string | null;
    checked_at: string;
  }>;
}

const statusConfig = {
  up:               { label: 'Работает',    bgColor: 'bg-green-500',  icon: ArrowUp },
  degraded:         { label: 'Деградация',  bgColor: 'bg-yellow-500', icon: AlertTriangle },
  down:             { label: 'Не работает', bgColor: 'bg-red-500',    icon: ArrowDown },
  unknown:          { label: 'Неизвестно',  bgColor: 'bg-gray-500',   icon: AlertTriangle },
  success:          { label: 'Успешно',     bgColor: 'bg-green-500',  icon: ArrowUp },
  success_degraded: { label: 'Деградация',  bgColor: 'bg-yellow-500', icon: AlertTriangle },
  failure:          { label: 'Ошибка',      bgColor: 'bg-red-500',    icon: ArrowDown },
  timeout:          { label: 'Таймаут',     bgColor: 'bg-red-500',    icon: ArrowDown },
  error:            { label: 'Ошибка',      bgColor: 'bg-red-500',    icon: ArrowDown },
};

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  up: 'success',
  degraded: 'warning',
  down: 'destructive',
  unknown: 'secondary',
  success: 'success',
  success_degraded: 'warning',
  failure: 'destructive',
  timeout: 'destructive',
  error: 'destructive',
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.unknown;
  const variant = statusVariant[status] ?? 'secondary';
  const Icon = config.icon;
  return (
    <Badge variant={variant}>
      <Icon />
      {config.label}
    </Badge>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)} мс`;
  return `${(ms / 1000).toFixed(2)} с`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('ru-RU');
}

function StatsCard({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: LucideIcon; trend?: 'up' | 'down' | 'warning' }) {
  const bgColor = trend === 'up' ? 'bg-green-100 dark:bg-green-900' : trend === 'down' ? 'bg-red-100 dark:bg-red-900' : trend === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-blue-100 dark:bg-blue-900';
  const iconColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : trend === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}

function MonitorCard({
  monitor,
  recentChecks,
  isAuthenticated,
  onEdit,
  onDelete,
  onCheckNow,
  isCheckingNow = false,
}: {
  monitor: PublicMonitor;
  recentChecks: MonitorCheck[];
  isAuthenticated: boolean;
  onEdit?: (monitor: PublicMonitor) => void;
  onDelete?: (monitor: PublicMonitor) => void;
  onCheckNow?: (monitor: PublicMonitor) => void;
  isCheckingNow?: boolean;
}) {
  const checksToShow = recentChecks.slice(0, 30).reverse();

  return (
    <div className="mb-6">
      <Card className="p-6 overflow-visible relative">
        <Link to={`/monitor/${monitor.id}`} className="block hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">{monitor.name}</h3>
            <StatusBadge status={monitor.status} />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Последние 30 проверок:</p>
            <div className="flex gap-1">
              {checksToShow.map((check, idx) => {
                const checkConfig = statusConfig[check.status as keyof typeof statusConfig] || statusConfig.unknown;
                return (
                  <div
                    key={idx}
                    className={`h-10 flex-1 rounded ${checkConfig.bgColor} cursor-pointer hover:opacity-80 transition-opacity relative group`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      <div className="font-semibold mb-1">
                        {check.status === 'success' ? 'Успешно' :
                         check.status === 'success_degraded' ? 'Деградация' : 'Ошибка'}
                      </div>
                      {check.response_time && (
                        <div>Время ответа: {formatDuration(check.response_time)}</div>
                      )}
                      {check.dns_time !== null && (
                        <div>DNS: {formatDuration(check.dns_time)}</div>
                      )}
                      {check.connect_time !== null && (
                        <div>Подключение: {formatDuration(check.connect_time)}</div>
                      )}
                      {check.ttfb !== null && (
                        <div>TTFB: {formatDuration(check.ttfb)}</div>
                      )}
                      {check.status_code && (
                        <div>Код: {check.status_code}</div>
                      )}
                      <div className="mt-1 text-gray-400">{formatTimestamp(check.checked_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Link>

        {isAuthenticated && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(monitor);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Изменить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                onCheckNow?.(monitor);
              }}
              disabled={isCheckingNow}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isCheckingNow ? 'animate-spin' : ''}`} />
              {isCheckingNow ? 'Проверка...' : 'Проверить'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete?.(monitor);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Удалить
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function MonitorDetailView({ monitorId }: { monitorId: string }) {
  const { data: monitor, isLoading, error } = useQuery<MonitorDetail>({
    queryKey: ['monitor-detail', monitorId],
    queryFn: async () => {
      const response = await api.get(`/public/monitors/${monitorId}`);
      return response.data;
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoaderCircle className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Не удалось загрузить данные монитора</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Назад к панели
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{monitor.name}</h1>
          <StatusBadge status={monitor.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Uptime (24ч)"
          value={`${monitor.uptime_24h}%`}
          icon={Activity}
          trend={monitor.uptime_24h >= 99 ? 'up' : 'down'}
        />
        <StatsCard
          title="Uptime (7д)"
          value={`${monitor.uptime_7d}%`}
          icon={Activity}
          trend={monitor.uptime_7d >= 99 ? 'up' : 'down'}
        />
        <StatsCard
          title="Среднее время ответа"
          value={monitor.avg_response_time_24h ? formatDuration(monitor.avg_response_time_24h) : 'N/A'}
          icon={Clock}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Последние проверки</h2>
        <div className="space-y-2">
          {monitor.recent_checks.map((check) => {
            return (
              <Card key={check.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={check.status} />
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(check.checked_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {check.response_time && (
                      <div>
                        <span className="text-muted-foreground">Ответ: </span>
                        <span className="font-semibold">{formatDuration(check.response_time)}</span>
                      </div>
                    )}
                    {check.status_code && (
                      <div>
                        <span className="text-muted-foreground">Код: </span>
                        <span className="font-semibold">{check.status_code}</span>
                      </div>
                    )}
                    {check.error_message && (
                      <div className="text-destructive">
                        {check.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [monitorToDelete, setMonitorToDelete] = useState<PublicMonitor | null>(null);
  const [checkingNowId, setCheckingNowId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get('/public/stats');
      return response.data;
    },
    refetchInterval: 30000,
    enabled: !id,
  });

  const { data: monitors, isLoading: monitorsLoading } = useQuery<PublicMonitor[]>({
    queryKey: ['monitors-public'],
    queryFn: async () => {
      const response = await api.get('/public/monitors');
      return response.data;
    },
    refetchInterval: 10000,
    enabled: !id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (monitorId: number) => {
      await api.delete(`/monitors/${monitorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors-public'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-checks'] });
      setMonitorToDelete(null);
    },
  });

  const checkNowMutation = useMutation({
    mutationFn: async (monitorId: number) => {
      setCheckingNowId(monitorId);
      const response = await api.post(`/monitors/${monitorId}/check-now`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors-public'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-checks'] });
      setCheckingNowId(null);
    },
    onError: () => {
      setCheckingNowId(null);
    },
  });

  const handleCreateMonitor = () => {
    setSelectedMonitor(null);
    setIsFormOpen(true);
  };

  const handleEditMonitor = async (publicMonitor: PublicMonitor) => {
    try {
      const response = await api.get(`/monitors/${publicMonitor.id}`);
      setSelectedMonitor(response.data.monitor);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Failed to fetch monitor details:', error);
    }
  };

  const handleDeleteMonitor = (monitor: PublicMonitor) => {
    setMonitorToDelete(monitor);
  };

  const handleCheckNow = (monitor: PublicMonitor) => {
    checkNowMutation.mutate(monitor.id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedMonitor(null);
    queryClient.invalidateQueries({ queryKey: ['monitors-public'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const { data: allChecks } = useQuery({
    queryKey: ['all-checks'],
    queryFn: async () => {
      if (!monitors) return {};

      const checksMap: { [key: number]: MonitorCheck[] } = {};
      await Promise.all(
        monitors.map(async (monitor) => {
          try {
            const response = await api.get(`/public/monitors/${monitor.id}`);
            checksMap[monitor.id] = response.data.recent_checks || [];
          } catch {
            checksMap[monitor.id] = [];
          }
        })
      );
      return checksMap;
    },
    enabled: !!monitors && !id,
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {id ? (
          <MonitorDetailView monitorId={id} />
        ) : (
          <>
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderCircle className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatsCard
                  title="Всего мониторов"
                  value={stats.total_monitors}
                  icon={Activity}
                />
                <StatsCard
                  title="Работают"
                  value={stats.up}
                  icon={ArrowUp}
                  trend="up"
                />
                <StatsCard
                  title="Деградация"
                  value={stats.degraded}
                  icon={AlertTriangle}
                  trend="warning"
                />
                <StatsCard
                  title="Не работают"
                  value={stats.down}
                  icon={ArrowDown}
                  trend="down"
                />
                <StatsCard
                  title="Общий Uptime"
                  value={`${stats.overall_uptime_24h}%`}
                  icon={Activity}
                />
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Мониторы</h2>
                {isAuthenticated && (
                  <Button onClick={handleCreateMonitor}>
                    Создать монитор
                  </Button>
                )}
              </div>
              {monitorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderCircle className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : monitors && monitors.length > 0 ? (
                <div>
                  {monitors.map((monitor) => (
                    <MonitorCard
                      key={monitor.id}
                      monitor={monitor}
                      recentChecks={allChecks?.[monitor.id] || []}
                      isAuthenticated={isAuthenticated}
                      onEdit={handleEditMonitor}
                      onDelete={handleDeleteMonitor}
                      onCheckNow={handleCheckNow}
                      isCheckingNow={checkingNowId === monitor.id}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Мониторы не найдены</h3>
                    <p className="text-muted-foreground">
                      {isAuthenticated
                        ? 'Начните с создания первого монитора для отслеживания'
                        : 'Пока нет настроенных мониторов.'}
                    </p>
                    {isAuthenticated && (
                      <div className="mt-6">
                        <Button onClick={handleCreateMonitor}>
                          Создать первый монитор
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </main>

      {isAuthenticated && (
        <MonitorForm
          open={isFormOpen}
          onClose={handleFormClose}
          monitor={selectedMonitor}
        />
      )}

      {isAuthenticated && (
        <AlertDialog
          open={!!monitorToDelete}
          onOpenChange={(open) => !open && setMonitorToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить монитор?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить монитор "
                {monitorToDelete?.name}"? Это действие нельзя отменить. Вся
                история проверок будет потеряна.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() =>
                  monitorToDelete && deleteMutation.mutate(monitorToDelete.id)
                }
              >
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
