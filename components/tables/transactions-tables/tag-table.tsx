// warehouse-client/components/tables/tag-tables/tag-table.tsx
'use client';
import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTransactionQuery, useAddTransaction } from '@/lib/queries/transactions';
import { pusherChannel, PUSHER_CONSTANTS } from '@/lib/pusher';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction } from './columns';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Pusher from 'pusher-js';

interface DataTableProps {
  columns: ColumnDef<Transaction>[];
  searchKey: string;
  pageNo: number;
  pageCount: number;
  pageLimit: number;
}

interface ScanData {
  timestamp: string;
  epc: string;
  rssi: string;
  mode: string;
}

interface GroupedTransaction extends Transaction {
  count: number;
}

export function TransactionTable({
  columns,
  pageNo,
  searchKey,
  pageCount,
  pageLimit,
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const addTransaction = useAddTransaction();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { data: transactionData } = useTransactionQuery(pageNo, pageLimit);

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: pageNo - 1,
    pageSize: pageLimit
  });

  const [isCountMode, setIsCountMode] = useState(false);

  // Modify the memo to handle grouped transactions
  const allTransactions = React.useMemo(() => {
    const baseTransactions = [...transactions, ...(transactionData?.transactions ?? [])] as Transaction[];
    
    if (!isCountMode) {
      return baseTransactions;
    }

    // Group transactions by EPC and count occurrences
    const groupedMap = baseTransactions.reduce((acc, curr) => {
      const key = curr.epc;
      if (!acc.has(key)) {
        acc.set(key, {
          ...curr,
          count: 1
        });
      } else {
        const existing = acc.get(key)!;
        acc.set(key, {
          ...existing,
          count: existing.count + 1
        });
      }
      return acc;
    }, new Map<string, GroupedTransaction>());

    return Array.from(groupedMap.values());
  }, [transactions, transactionData, isCountMode]);

  const table = useReactTable<Transaction>({
    data: allTransactions,
    columns,
    pageCount: pageCount,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: { pageIndex, pageSize }
    },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true
  });

  useEffect(() => {
    const pusher = new Pusher('41a1ec9bc21c0ec74674', {
      cluster: 'ap1'
    });

    const channel = pusher.subscribe('rfid-scan');
    channel.bind('tag-scanned', (data: {
      timestamp: string;
      epc: string;
      rssi: string;
      mode: string;
    }) => {
      // Convert the data to match the backend DTO format
      const transactionData = {
        Tag: data.epc,
        DeviceNo: 1, // Default device number
        AntennaNo: 1, // Default antenna number
        Timestamp: data.timestamp,
        ScanCount: 1, // Default scan count
        mode: data.mode
      };

      // Send to backend
      addTransaction.mutate(transactionData);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [addTransaction]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder={`Search ${searchKey}...`}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn(searchKey)?.setFilterValue(event.target.value)
          }
          className="w-full md:max-w-sm"
        />
        
        <div className="flex items-center space-x-2">
          <Switch
            id="count-mode"
            checked={isCountMode}
            onCheckedChange={setIsCountMode}
          />
          <Label htmlFor="count-mode">
            {isCountMode ? 'Count Mode' : 'Normal Mode'}
          </Label>
        </div>
      </div>
      <ScrollArea className="h-[calc(80vh-220px)] rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No transactions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex justify-between py-4">
        <div>
          Page {pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <DoubleArrowLeftIcon />
          </Button>
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <DoubleArrowRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
