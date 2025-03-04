'use client';

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import Pusher from 'pusher-js';

export function DeviceStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const pusher = new Pusher('41a1ec9bc21c0ec74674', {
      cluster: 'ap1'
    });

    const channel = pusher.subscribe('rfid-scan');
    
    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
    });

    channel.bind('pusher:subscription_error', () => {
      setIsConnected(false);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  return (
    <Badge variant={isConnected ? "success" : "destructive"}>
      {isConnected ? "Connected" : "Disconnected"}
    </Badge>
  );
}
