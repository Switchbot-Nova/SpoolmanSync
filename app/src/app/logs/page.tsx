'use client';

import { useState, useEffect, useRef } from 'react';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivityLog {
  id: string;
  type: string;
  message: string;
  details: string | null;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchLogs();

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.eventType === 'activity_log') {
          // Prepend new log to the list
          setLogs((prevLogs) => {
            // Avoid duplicates
            if (prevLogs.some((log) => log.id === data.id)) {
              return prevLogs;
            }
            return [{
              id: data.id,
              type: data.type,
              message: data.message,
              details: data.details,
              createdAt: data.createdAt,
            }, ...prevLogs].slice(0, 100); // Keep max 100 logs
          });
        }
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'spool_change':
        return 'default';
      case 'connection':
        return 'secondary';
      case 'webhook':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Activity Logs</h1>
            {connected && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <Button variant="outline" onClick={fetchLogs}>
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No activity logs yet
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between sm:contents">
                      <Badge variant={getTypeBadgeVariant(log.type)} className="shrink-0">
                        {log.type}
                      </Badge>
                      <time className="text-xs text-muted-foreground whitespace-nowrap sm:order-last">
                        {formatDate(log.createdAt)}
                      </time>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words">{log.message}</p>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Details
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
