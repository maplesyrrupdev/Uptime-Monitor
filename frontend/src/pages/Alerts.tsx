import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { AlertCard } from '@/components/alerts/AlertCard';
import { AlertForm } from '@/components/alerts/AlertForm';
import { AlertLogs } from '@/components/alerts/AlertLogs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import api from '@/lib/api';
import type { Alert, AlertLog, CreateAlertData, UpdateAlertData } from '@/types/alert';
import type { AlertFormData } from '@/lib/validations/alert';

export function Alerts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | undefined>();
  const [viewingLogs, setViewingLogs] = useState<Alert | undefined>();
  const [deletingAlert, setDeletingAlert] = useState<Alert | undefined>();

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await api.get('/alerts');
      return response.data.alerts;
    },
  });

  const { data: monitors = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ['monitors-list'],
    queryFn: async () => {
      const response = await api.get('/monitors');
      return response.data.monitors.map((m: { id: number; name: string }) => ({ id: m.id, name: m.name }));
    },
  });

  const { data: logs = [] } = useQuery<AlertLog[]>({
    queryKey: ['alert-logs', viewingLogs?.id],
    queryFn: async () => {
      if (!viewingLogs) return [];
      const response = await api.get(`/alerts/${viewingLogs.id}/logs`);
      return response.data.logs;
    },
    enabled: !!viewingLogs,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAlertData) => {
      await api.post('/alerts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAlertData }) => {
      await api.put(`/alerts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setEditingAlert(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setDeletingAlert(undefined);
    },
  });

  const handleCreate = (data: AlertFormData) => {
    createMutation.mutate({
      ...data,
      webhook_headers: data.webhook_headers || {}
    });
  };

  const handleUpdate = (data: AlertFormData) => {
    if (editingAlert) {
      updateMutation.mutate({ 
        id: editingAlert.id, 
        data: {
          ...data,
          webhook_headers: data.webhook_headers || {}
        }
      });
    }
  };

  const handleDelete = (alert: Alert) => {
    setDeletingAlert(alert);
  };

  const confirmDelete = () => {
    if (deletingAlert) {
      deleteMutation.mutate(deletingAlert.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto py-6 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Алерты</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Настройте webhook-алерты для мониторинга состояния ресурсов
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            Добавить алерт
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!isLoading && alerts.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Нет алертов</h3>
              <p className="text-muted-foreground mb-4">
                Создайте первый алерт, чтобы получать уведомления о состоянии мониторов.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Добавить алерт
              </Button>
            </div>
          </Card>
        )}

        {!isLoading && alerts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onEdit={(a) => setEditingAlert(a)}
                onDelete={handleDelete}
                onViewLogs={(a) => setViewingLogs(a)}
              />
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-xl font-semibold mb-4">Создать алерт</DialogTitle>
            <AlertForm
              monitors={monitors}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingAlert} onOpenChange={(open) => !open && setEditingAlert(undefined)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-xl font-semibold mb-4">Изменить алерт</DialogTitle>
            {editingAlert && (
              <AlertForm
                alert={editingAlert}
                monitors={monitors}
                onSubmit={handleUpdate}
                onCancel={() => setEditingAlert(undefined)}
                isSubmitting={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewingLogs} onOpenChange={(open) => !open && setViewingLogs(undefined)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {viewingLogs && (
              <AlertLogs
                logs={logs}
                onClose={() => setViewingLogs(undefined)}
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingAlert} onOpenChange={(open) => !open && setDeletingAlert(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить алерт?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы действительно хотите удалить алерт "{deletingAlert?.name}"? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDelete}>
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
