'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { StartInventoryForm } from './StartInventoryForm';
import { Dialog } from '@/components/ui/dialog';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { useInventory } from '@/lib/devices/inventory';
import { useTaskStore } from '@/lib/store';
import { useTransactionQuery } from '@/lib/queries/transactions';
import { useBatchQuery } from '@/lib/queries/batch';

export function ProductQuickActions({
  children
}: {
  children: React.ReactNode;
}) {
  const [isScanProductOpen, setIsScanProductOpen] = useState(false);
  const { startInventory } = useInventory();
  const { data: batchData, isLoading: isLoadingBatch } = useBatchQuery(1, 10);
  const setBatchId = useTaskStore((state) => state.setBatchId);

  const handleScanProduct = async () => {
    if (!isLoadingBatch) {
      if (batchData) {
        setBatchId(batchData.batch[0].id);
      }
    }

    setIsScanProductOpen(true);
  };

  const handleInventoryStart = () => {
    setIsScanProductOpen(false);
  };

  return (
    <>
      <ResponsiveDialog
        isOpen={isScanProductOpen}
        setIsOpen={setIsScanProductOpen}
        title="Start Scanning Inventory"
      >
        <StartInventoryForm onInventoryStart={handleInventoryStart} />
      </ResponsiveDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <button
              className="flex w-full justify-start rounded-md p-2 transition-all duration-75"
              onClick={handleScanProduct}
            >
              Scan Product
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
