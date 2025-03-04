import { useDisconnectDevice } from '@/lib/devices/disconnect';
import { useGetDevices } from '@/lib/devices/get-devices';
import { useInventory } from '@/lib/devices/inventory';
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  ip: z.string().ip({
    message: 'Input a valid IP ex. 192.x.x.x'
  }),
  port: z.string()
});

type FormSchema = z.infer<typeof formSchema>;

interface UseInventoryFormProps {
  form: UseFormReturn<FormSchema>;
}

export function useInventoryForm({ form }: UseInventoryFormProps) {
  const [isInventoryStarted, setIsInventoryStarted] = useState(false);
  const { data, loading, tags, error, startInventory, stopInventory } =
    useInventory();
  const {
    getDevices,
    data: devices,
    loading: devicesLoading
  } = useGetDevices();
  const { disconnectDevice, loading: disconnectLoading } =
    useDisconnectDevice();

  useEffect(() => {
    if (tags.length > 0) {
      console.log(tags);
      const lastTag = tags[tags.length - 1];
      toast.success(`New Tag: ${lastTag}`);
    }

    console.log(tags);
  }, [tags]);

  useEffect(() => {
    const handleStateChanges = () => {
      if (devices && devices.length > 0) {
        form.setValue('ip', devices[0].ip);
        form.setValue('port', devices[0].port.toString());
      }

      if (data === 'InventoryStarted') {
        setIsInventoryStarted(true);
      }

      if (!loading && !data) {
        setIsInventoryStarted(false);
      }
    };

    handleStateChanges();
  }, [devices, data, loading, form]);

  return {
    disconnectDevice,
    isInventoryStarted,
    loading,
    error,
    devicesLoading,
    disconnectLoading,
    startInventory,
    stopInventory,
    getDevices
  };
}
