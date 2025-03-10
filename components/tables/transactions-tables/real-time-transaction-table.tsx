import { useState, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pusherClient, PUSHER_CONSTANTS } from '@/lib/pusher';
import { Transaction, TransactionEvent } from './columns';
import { Loader2 } from 'lucide-react';
import { simulatePusherEvent } from '@/lib/pusher-client-utils';
import axios from 'axios';
import { CreateBatchDialog } from '@/components/dialogs/create-batch-dialog';

interface RealTimeTransactionTableProps {
  onSelectedChange: (transactions: Transaction[]) => void;
  isCountMode?: boolean;
}

// Interface for grouped transactions with count
interface GroupedTransaction extends Transaction {
  count: number;
}

export function RealTimeTransactionTable({
  onSelectedChange,
  isCountMode = false
}: RealTimeTransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [epcCounts, setEpcCounts] = useState<Record<string, number>>({});
  const [lastScannedTime, setLastScannedTime] = useState<
    Record<string, string>
  >({});
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const { toast } = useToast();

  // Process transactions based on mode (normal or count)
  const processedTransactions = useMemo(() => {
    if (!isCountMode) {
      return transactions;
    }

    // Create a map of unique EPCs with their latest transaction and count
    const uniqueEpcs = new Map<string, GroupedTransaction>();

    // Sort transactions by timestamp in descending order
    const sortedTransactions = [...transactions].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Only take the most recent transaction for each EPC
    sortedTransactions.forEach((transaction) => {
      const key = transaction.epc;
      if (!uniqueEpcs.has(key)) {
        uniqueEpcs.set(key, {
          ...transaction,
          count: epcCounts[key] || 1
        });
      }
    });

    return Array.from(uniqueEpcs.values());
  }, [transactions, epcCounts, isCountMode]);

  useEffect(() => {
    console.log(
      'RealTimeTransactionTable mounted, subscribing to Pusher events'
    );

    // Handle incoming transactions
    const handleTagScanned = (data: TransactionEvent) => {
      console.log('Received tag scan event:', data);

      const currentTime = new Date(data.timestamp).getTime();
      const lastScanned = lastScannedTime[data.epc];
      const timeDiff = lastScanned
        ? currentTime - new Date(lastScanned).getTime()
        : Infinity;

      // Only count if more than 5 seconds have passed since last scan of this tag
      const shouldCount = !lastScanned || timeDiff > 5000;

      if (shouldCount) {
        // Update last scanned time
        setLastScannedTime((prev) => ({
          ...prev,
          [data.epc]: data.timestamp
        }));

        // Update EPC counts
        setEpcCounts((prev) => {
          const newCount = (prev[data.epc] || 0) + 1;

          // Show toast notification with count
          toast({
            title: 'Tag Scanned',
            description: `EPC: ${data.epc} (Count: ${newCount})`
          });

          return {
            ...prev,
            [data.epc]: newCount
          };
        });
      }

      // Create a new transaction object
      const newTransaction: Transaction = {
        id: data.id || Date.now(),
        epc: data.epc,
        rssi: data.rssi,
        timestamp: data.timestamp,
        mode: data.mode,
        isTemp: data.isTemp || false
      };

      // Only add new transaction if we're not in count mode or if it's a counted scan
      if (!isCountMode || shouldCount) {
        setTransactions((prev) => [newTransaction, ...prev]);
      }
    };

    // Subscribe to the event
    pusherClient.bind(PUSHER_CONSTANTS.EVENTS.TAG_SCANNED, handleTagScanned);

    return () => {
      // Cleanup
      console.log(
        'RealTimeTransactionTable unmounting, unbinding Pusher events'
      );
      pusherClient.unbind(
        PUSHER_CONSTANTS.EVENTS.TAG_SCANNED,
        handleTagScanned
      );
    };
  }, [toast]);

  const handleRowSelect = (transaction: Transaction, checked: boolean) => {
    const updatedSelection = checked
      ? [...selectedRows, transaction]
      : selectedRows.filter((t) => t.id !== transaction.id);

    setSelectedRows(updatedSelection);
    onSelectedChange(updatedSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? [...transactions] : [];
    setSelectedRows(newSelection);
    onSelectedChange(newSelection);
  };

  // Function to reset counts
  const resetCounts = () => {
    setEpcCounts({});
  };

  // Check if any transactions are selected
  const hasSelectedTransactions = selectedRows.length > 0;

  // Function to prepare transactions for batch
  const prepareForBatch = () => {
    if (processedTransactions.length === 0) {
      toast({
        title: 'No transactions to select',
        description: 'There are no transactions to select for batching.',
        variant: 'destructive'
      });
      return;
    }

    // Check if any transactions are selected
    if (!hasSelectedTransactions) {
      toast({
        title: 'No transactions selected',
        description: 'Please select transactions to add to a batch.',
        variant: 'destructive'
      });
      return;
    }

    // Open the batch creation dialog
    setShowBatchDialog(true);
  };

  // Function to handle batch creation completion
  const handleBatchCreated = () => {
    setShowBatchDialog(false);
    setSelectedRows([]);
    onSelectedChange([]);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedTransactions');
    }

    toast({
      title: 'Success',
      description: 'Selected transactions have been added to the batch'
    });
  };

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between bg-muted/20 p-2">
        <span className="text-sm text-muted-foreground">
          {isCountMode
            ? 'Count Mode: Showing unique EPCs with running count'
            : 'Normal Mode: Showing all transactions'}
        </span>
        <div className="flex gap-2">
          {isCountMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCounts}
              className="text-xs"
            >
              Reset Counts
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                if (!hasSelectedTransactions) {
                  toast({
                    title: 'No transactions selected',
                    description: 'Please select transactions to create.',
                    variant: 'destructive'
                  });
                  return;
                }

                try {
                  // Create transactions through the API
                  for (const transaction of selectedRows) {
                    const response = await axios.post(
                      `${
                        process.env.NEXT_PUBLIC_API_HUB ||
                        'http://localhost:9001'
                      }/api/v1/transaction`,
                      {
                        epc: transaction.epc,
                        rssi: transaction.rssi,
                        mode: transaction.mode || 'manual',
                        timestamp:
                          transaction.timestamp || new Date().toISOString()
                      }
                    );

                    // Update the transaction in the list with the new ID from the response
                    setTransactions((prev) =>
                      prev.map((t) =>
                        t.id === transaction.id
                          ? { ...t, id: response.data.data.id, isTemp: false }
                          : t
                      )
                    );
                  }

                  setSelectedRows([]);
                  onSelectedChange([]);
                  toast({
                    title: 'Success',
                    description: `Created ${selectedRows.length} transaction${
                      selectedRows.length > 1 ? 's' : ''
                    } successfully`
                  });
                } catch (error) {
                  console.error('Error creating transactions:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to create transactions',
                    variant: 'destructive'
                  });
                }
              }}
              disabled={!hasSelectedTransactions}
            >
              Create Transaction
            </Button>
            <CreateBatchDialog
              selectedTransactions={selectedRows}
              onBatchCreated={handleBatchCreated}
              buttonLabel="Create & Save Batch"
            />
          </div>
        </div>
      </div>
      <div className="relative">
        <table className="w-full">
          <thead className="sticky top-0 z-10 border-b bg-muted/50">
            <tr>
              <th className="h-12 px-4">
                <Checkbox
                  checked={
                    selectedRows.length > 0 &&
                    selectedRows.length === transactions.length
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked as boolean)
                  }
                />
              </th>
              <th className="px-4 text-left">EPC</th>
              <th className="px-4 text-left">RSSI</th>
              <th className="px-4 text-left">Timestamp</th>
              <th className="px-4 text-left">Mode</th>
              <th className="px-4 text-left">Status</th>
              {isCountMode && <th className="px-4 text-left">Count</th>}
            </tr>
          </thead>
        </table>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <tbody>
              {(isCountMode ? processedTransactions : transactions).map(
                (transaction) => {
                  // Ensure id is a number
                  const id = transaction.id;
                  if (id === undefined) return null;

                  return (
                    <tr key={id} className="border-b">
                      <td className="h-12 px-4">
                        <Checkbox
                          checked={selectedRows.some((t) => t.id === id)}
                          onCheckedChange={(checked) =>
                            handleRowSelect(transaction, checked as boolean)
                          }
                        />
                      </td>
                      <td className="px-4">{transaction.epc}</td>
                      <td className="px-4">{transaction.rssi} dBm</td>
                      <td className="px-4">{transaction.timestamp}</td>
                      <td className="px-4">{transaction.mode}</td>
                      <td className="px-4">
                        <Badge
                          variant={transaction.isTemp ? 'outline' : 'default'}
                        >
                          {transaction.isTemp ? 'Pending' : 'Saved'}
                        </Badge>
                      </td>
                      {isCountMode && (
                        <td className="px-4 font-medium">
                          {epcCounts[transaction.epc] || 1}
                        </td>
                      )}
                    </tr>
                  );
                }
              )}
              {(isCountMode ? processedTransactions : transactions).length ===
                0 && (
                <tr>
                  <td
                    colSpan={isCountMode ? 7 : 6}
                    className="h-24 text-center"
                  >
                    No transactions yet. Waiting for RFID scans...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
