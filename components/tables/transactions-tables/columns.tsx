'use client';
import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';

// Create a client-only date formatter component
const DateCell = dynamic(() => Promise.resolve(({ date }: { date: string }) => {
  const timestamp = new Date(date);
  return format(timestamp, 'dd/MM/yyyy HH:mm:ss');
}), { ssr: false });

export interface Transaction {
  id?: number;
  timestamp: string;
  epc: string;
  rssi: string;
  mode: string;
  count?: number; // Optional count for grouped mode
  isTemp?: boolean;
  readyForBatch?: boolean; // Flag to indicate if transaction is ready to be added to a batch
}

// Pusher event type
export interface TransactionEvent {
  id?: number;
  timestamp: string;
  epc: string;
  rssi: string;
  mode: string;
  isTemp?: boolean;
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
      return <DateCell date={row.getValue("timestamp")} />;
    },
  },
  {
    accessorKey: "epc",
    header: "EPC",
  },
  {
    accessorKey: "rssi",
    header: "RSSI",
    cell: ({ row }) => {
      return `${row.getValue("rssi")} dBm`;
    },
  },
  {
    accessorKey: "mode",
    header: "Mode",
  },
  {
    accessorKey: "count",
    header: "Count",
    cell: ({ row }) => {
      const count = row.getValue("count");
      return count ? count : 1;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return (
        <Badge variant={row.original.isTemp ? "outline" : "default"}>
          {row.original.isTemp ? "Pending" : "Saved"}
        </Badge>
      );
    },
  }
];
