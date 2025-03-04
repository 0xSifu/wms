'use client';

import { Button } from '@/components/ui/button';
import { useGetDevices } from '@/lib/devices/get-devices';

export function GetDevicesButton() {
  const { getDevices, data, attempts, error, loading } = useGetDevices();
  return (
    <>
      <Button onClick={getDevices} disabled={loading}>
        {loading ? `Searching device, attempts ${attempts}` : 'Get Devices'}
      </Button>
    </>
  );
}
