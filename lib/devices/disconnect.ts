import { useState } from 'react';
import { conn } from '../signalr';
import { toast } from 'sonner';
import { useDeviceStore } from '../store';

export function useDisconnectDevice() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    setDeviceStatus,
    setDeviceIp,
    resetDeviceStore,
    ip: deviceIp,
    status: deviceStatus
  } = useDeviceStore();

  const disconnectDevice = async () => {
    try {
      setLoading(true);
      setError(null);
      conn.on('Disconnected', (success) => {
        if (success) {
          resetDeviceStore();
          toast.success('Device Disconnected');
        }
      });
      await conn.start();
      await conn.invoke('Disconnect');
      conn.off('InventoryStarted');
      setLoading(false);
      setData('Disconnected');
      resetDeviceStore();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  return { disconnectDevice, loading, data, error };
}
