import { useEffect, useState } from 'react';
import { conn } from '../signalr';
import { toast } from 'sonner';
import { useMutationTx } from '../queries/transactions';
import { useDeviceStore } from '../store';

export function useInventory() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const {
    setDeviceStatus,
    setDeviceIp,
    resetDeviceStore,
    ip: deviceIp,
    status: deviceStatus
  } = useDeviceStore();
  const mutation = useMutationTx();

  const startInventory = async (ip: string, port: string, batchId: number) => {
    try {
      setLoading(true);
      setError(null);

      conn.on('Connected', (deviceHandle: string) => {
        if (deviceHandle) {
          console.log('🚀 ~ conn.on ~ deviceHandle:', deviceHandle);
          setDeviceStatus(true);
          setDeviceIp(ip);
        }

        setData('Connected');
        setLoading(false);
      });

      conn.on('Error', (errorMsg: string) => {
        resetDeviceStore();
        setError(errorMsg);
        setLoading(false);
      });

      conn.on('InventoryStarted', (tags: any) => {
        setData('InventoryStarted');
        setLoading(false);
      });

      conn.on('TagRead', (tag: any) => {
        mutation.mutateAsync({
          AntennaNo: tag.antennaNo,
          batchId,
          DeviceNo: tag.deviceNo,
          Tag: tag.tag,
          Timestamp: tag.timestamp,
          ScanCount: 1
        });
        toast.success(`New Tag: ${tag.tag}`);
      });

      conn.on('Error', (errorMsg: string) => {
        setError(errorMsg);
        setLoading(false);
      });

      await conn.start();
      await conn.invoke('ConnectToDevice', ip, +port);
      await conn.invoke('GetDeviceVersion');
      await conn.invoke('StartInventory');
    } catch (err) {
      setTags([]);
      setLoading(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const stopInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      await conn.invoke('StopInventory');

      conn.off('Connected');
      conn.off('Error');
      conn.off('TagRead');
      conn.off('InventoryStarted');
      resetDeviceStore();

      await conn.stop();

      setTags([]);
      setData(null);
      setLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      conn.off('Connected');
      conn.off('InventoryStarted');
      conn.off('TagRead');
      conn.off('Error');
    };
  }, []);

  return { loading, data, tags, error, startInventory, stopInventory };
}
