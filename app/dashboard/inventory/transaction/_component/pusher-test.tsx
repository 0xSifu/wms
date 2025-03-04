'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { pusherClient, PUSHER_CONSTANTS } from '@/lib/pusher';
import { TransactionEvent } from '@/components/tables/transactions-tables/columns';
import { generateRandomTransactionEvent, simulatePusherEvent } from '@/lib/pusher-client-utils';
import { Badge } from '@/components/ui/badge';

interface PusherTestProps {
  isCountMode?: boolean;
}

export function PusherTest({ isCountMode = false }: PusherTestProps) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<TransactionEvent | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [eventCount, setEventCount] = useState(0);

  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    // Check connection state
    const connectionHandler = () => {
      addLog(`Pusher connection state: ${pusherClient.connection.state}`);
      setConnected(pusherClient.connection.state === 'connected');
    };

    // Handle events
    const eventHandler = (data: TransactionEvent) => {
      addLog(`Received event: ${JSON.stringify(data)}`);
      setLastEvent(data);
      setEventCount(prev => prev + 1);
    };

    // Subscribe to connection events
    pusherClient.connection.bind('state_change', connectionHandler);
    
    // Subscribe to tag events
    pusherClient.bind(PUSHER_CONSTANTS.EVENTS.TAG_SCANNED, eventHandler);

    // Initial connection check
    connectionHandler();

    return () => {
      pusherClient.connection.unbind('state_change', connectionHandler);
      pusherClient.unbind(PUSHER_CONSTANTS.EVENTS.TAG_SCANNED, eventHandler);
    };
  }, []);

  const handleReconnect = () => {
    addLog('Manually reconnecting...');
    pusherClient.disconnect();
    setTimeout(() => {
      pusherClient.connect();
    }, 1000);
  };

  const handleGenerateRandomEvent = () => {
    const randomEvent = generateRandomTransactionEvent();
    addLog(`Generating random event: ${JSON.stringify(randomEvent)}`);
    simulatePusherEvent(randomEvent);
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  const handleResetCounter = () => {
    setEventCount(0);
    addLog('Event counter reset');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Pusher Connection Status</span>
          <Badge variant="outline" className="ml-2">
            {isCountMode ? "Count Mode" : "Normal Mode"}
          </Badge>
        </CardTitle>
        <CardDescription className="flex justify-between">
          <span>
            Status: <span className={connected ? "text-green-500" : "text-red-500"}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </span>
          <span>
            Events: <span className="font-medium">{eventCount}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-medium">Last Event:</h3>
            <pre className="mt-1 rounded bg-slate-100 p-2 text-xs">
              {lastEvent ? JSON.stringify(lastEvent, null, 2) : 'No events received yet'}
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium">Connection Logs:</h3>
            <div className="mt-1 max-h-32 overflow-y-auto rounded bg-slate-100 p-2 text-xs">
              {logs.length > 0 ? (
                logs.map((log, i) => <div key={i}>{log}</div>)
              ) : (
                <div>No logs yet</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleReconnect}>Reconnect</Button>
        <Button size="sm" variant="outline" onClick={handleGenerateRandomEvent}>
          Generate Event
        </Button>
        <Button size="sm" variant="ghost" onClick={handleClearLogs}>
          Clear Logs
        </Button>
        <Button size="sm" variant="ghost" onClick={handleResetCounter}>
          Reset Counter
        </Button>
      </CardFooter>
    </Card>
  );
} 