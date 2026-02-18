import type { AlertLog } from '../../types/alert';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DialogTitle } from '../ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Activity,
  ArrowRight,
  Globe
} from 'lucide-react';

type AlertLogsProps = {
  logs: AlertLog[];
  onClose: () => void;
};

export function AlertLogs({ logs = [] }: AlertLogsProps) {
  const triggerLabels: Record<string, string> = {
    failure: 'Сбой',
    recovery: 'Восстановление',
    threshold_breach: 'Превышение порога',
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'secondary';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 600) return 'destructive';
    return 'secondary';
  };

  const getMethodVariant = (method: string): 'info' | 'success' => {
    return (method || '').toUpperCase() === 'POST' ? 'success' : 'info';
  };

  const hasHeaders = (headers: unknown) => {
    if (!headers) return false;
    if (Array.isArray(headers)) return headers.length > 0;
    return typeof headers === 'object' && Object.keys(headers).length > 0;
  };

  if (!Array.isArray(logs)) return null;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 pb-4 border-b">
        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          История отправки
        </DialogTitle>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
            <Activity className="h-12 w-12 opacity-20" />
            <p>Записей пока нет</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {logs.map((log) => {
              if (!log) return null;
              const payload = log.payload_sent || {};
              return (
              <Card key={log.id} className="overflow-hidden p-0 gap-0 shadow-sm border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3 bg-muted/30 pt-4 px-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono bg-background">
                        #{log.id}
                      </Badge>
                      <Badge variant={
                        log.trigger_reason === 'recovery' ? 'success' : 
                        log.trigger_reason === 'failure' ? 'destructive' : 'warning'
                      }>
                        {triggerLabels[log.trigger_reason] || log.trigger_reason}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
                        {log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: ru }) : '-'}
                      </span>
                    </div>
                    {log.response_status && (
                      <Badge variant={getStatusColor(log.response_status)}>
                        Status: {log.response_status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4 px-4 pb-4">
                  <div className="flex items-center gap-2 text-sm bg-muted/20 p-2 rounded-md border border-border/40">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">Монитор:</span>
                    <span className="font-medium text-foreground">{log.monitor?.name || `Monitor #${log.monitor_id}`}</span>
                    {log.monitor?.url && (
                      <a 
                        href={log.monitor.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 ml-auto text-xs"
                      >
                        {log.monitor.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {log.error_message && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex gap-3 items-start border border-destructive/20">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-xs uppercase tracking-wider">Ошибка отправки</p>
                        <p className="font-mono text-xs whitespace-pre-wrap">{log.error_message}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2 flex flex-col">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 pb-1 border-b">
                        <ArrowRight className="h-3.5 w-3.5" /> 
                        Запрос (Webhook)
                      </h4>
                      <div className="bg-muted/30 rounded-md p-3 text-xs font-mono space-y-3 border flex-1">
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Target</div>
                          <div className="flex items-start gap-2 break-all">
                            <Badge variant={getMethodVariant(payload.method)} className="shrink-0">
                              {payload.method || 'UNKNOWN'}
                            </Badge>
                            <span className="text-foreground">{payload.url || '-'}</span>
                          </div>
                        </div>
                        
                        {hasHeaders(payload.headers) && (
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Headers</div>
                            <details className="group">
                              <summary className="cursor-pointer hover:text-primary text-muted-foreground transition-colors list-none flex items-center gap-1">
                                <span className="group-open:rotate-90 transition-transform">▸</span>
                                <span className="text-muted-foreground">Показать заголовки</span>
                              </summary>
                              <div className="mt-1 pl-3 border-l-2 border-primary/20 space-y-0.5 py-1">
                                {Array.isArray(payload.headers) 
                                  ? payload.headers.map((h: unknown, i: number) => (
                                      <div key={i} className="break-all text-muted-foreground">{JSON.stringify(h)}</div>
                                    ))
                                  : Object.entries(payload.headers).map(([k, v]) => (
                                      <div key={k} className="break-all">
                                        <span className="text-muted-foreground">{k}:</span> <span className="text-foreground">{v as string}</span>
                                      </div>
                                    ))
                                }
                              </div>
                            </details>
                          </div>
                        )}

                        {payload.body && (
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Payload</div>
                            <div className="bg-background rounded border p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-[150px] overflow-y-auto custom-scrollbar">
                              {typeof payload.body === 'string' 
                                ? payload.body 
                                : JSON.stringify(payload.body, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 pb-1 border-b">
                        {log.response_status && log.response_status < 400 ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                        Ответ
                      </h4>
                      <div className="bg-muted/30 rounded-md p-3 text-xs font-mono space-y-3 border flex-1">
                         <div className="space-y-1">
                           <div className="text-[10px] text-muted-foreground uppercase font-bold">Response Body</div>
                           {log.response_body ? (
                             <div className="bg-background rounded border p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto custom-scrollbar">
                               {log.response_body}
                             </div>
                           ) : (
                             <div className="text-muted-foreground italic p-2 border border-dashed rounded text-center">
                               Нет тела ответа
                             </div>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

