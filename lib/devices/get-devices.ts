import { useState } from 'react';
import { conn } from '../signalr';

interface Device {
  mac: string;
  ip: string;
  port: string;
}

export function useGetDevices() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Device[]>([]);
  const [attempts, setAttemptsData] = useState(0);
  const [error, setError] = useState<string | null>(null);
  let isDisconnectedIntentionally = false;

  const getDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      setAttemptsData(0);

      conn.on('OnAttempts', (attempts: number) => {
        setAttemptsData(attempts);
      });

      conn.on('Success', (devices: Device[]) => {
        setData(devices);
        setLoading(false);
        isDisconnectedIntentionally = true;
        conn.stop();
      });

      conn.on('Error', (errorMsg: string) => {
        setError(errorMsg);
        setLoading(false);
        conn.stop();
        isDisconnectedIntentionally = true;
      });

      conn.onclose((error) => {
        if (error && !isDisconnectedIntentionally) {
          setError(error instanceof Error ? error.message : String(error));
          setLoading(false);
        }
      });

      await conn.start();
      await conn.invoke('GetDevices', 'ZL', 10);
    } catch (err) {
      if (!isDisconnectedIntentionally) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }
  };

  return { loading, data, error, attempts, getDevices };
}
