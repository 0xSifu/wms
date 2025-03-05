'use client';

import { useState } from 'react';
import { RealTimeTransactionTable } from '@/components/tables/transactions-tables/real-time-transaction-table';
import { CreateBatchDialog } from '@/components/dialogs/create-batch-dialog';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import {
  columns,
  Transaction
} from '@/components/tables/transactions-tables/columns';
import { TransactionTable } from '@/components/tables/transactions-tables/tag-table';
import { Separator } from '@/components/ui/separator';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Heading } from '@/components/ui/heading';
import { queryClient } from '@/lib/queryClient';
import { fetchTransactions } from '@/lib/queries/transactions';
import { DeviceStatus } from './_component/device-status';
import { QuickActions } from './_component/quick-actions';
import { PusherTest } from './_component/pusher-test';
import { TestEventGenerator } from './_component/test-event-generator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { HistoryTransactionTable } from '@/components/tables/transactions-tables/history-transaction-table';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Transaction', link: '/dashboard/inventory/transaction' }
];

const PAGE_LIMIT = 10;

export default function TransactionPage() {
  const [selectedTransactions, setSelectedTransactions] = useState<
    Transaction[]
  >([]);
  const [showDebug, setShowDebug] = useState(false);
  const [isCountMode, setIsCountMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'transaction' | 'history'>(
    'transaction'
  );
  const { toast } = useToast();

  const handleBatchCreated = () => {
    setSelectedTransactions([]);
  };

  const handleCreateTransactions = async () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one row to create transactions',
        variant: 'destructive'
      });
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each selected transaction
    for (const transaction of selectedTransactions) {
      try {
        await axios.post(
          `${
            process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001'
          }/api/v1/transaction`,
          {
            epc: transaction.epc,
            rssi: transaction.rssi,
            mode: transaction.mode || 'manual',
            timestamp: transaction.timestamp || new Date().toISOString()
          }
        );
        successCount++;
      } catch (error) {
        console.error('Error creating transaction:', error);
        failureCount++;
      }
    }

    // Show summary toast
    if (successCount > 0) {
      toast({
        title: 'Success',
        description: `Created ${successCount} transaction${
          successCount > 1 ? 's' : ''
        }${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
        variant: 'default'
      });
    } else if (failureCount > 0) {
      toast({
        title: 'Error',
        description: `Failed to create ${failureCount} transaction${
          failureCount > 1 ? 's' : ''
        }`,
        variant: 'destructive'
      });
    }

    // Clear selection after processing
    setSelectedTransactions([]);
  };

  // Handle selected transactions from the table
  const handleSelectedChange = (selectedTransactions: Transaction[]) => {
    // Now we're receiving the actual transaction objects instead of just IDs
    setSelectedTransactions(selectedTransactions);
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title="Transactions"
            description="Manage current tags, the initial data captured from the scanner in certain batch."
          />
          <div className="flex items-center gap-4">
            {activeTab === 'transaction' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="count-mode"
                  checked={isCountMode}
                  onCheckedChange={setIsCountMode}
                />
                <Label htmlFor="count-mode" className="text-sm">
                  Count Mode {isCountMode ? '(On)' : '(Off)'}
                </Label>
              </div>
            )}
            <DeviceStatus />
            <QuickActions />
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
          </div>
        </div>
        <Separator />

        {/* Navigation Section */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('transaction')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'transaction'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Transaction
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'history'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </div>

        {showDebug && activeTab === 'transaction' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PusherTest isCountMode={isCountMode} />
            <TestEventGenerator />
          </div>
        )}

        <div className="mb-4 flex justify-end gap-2">
          {/* <Button 
            variant="outline"
            onClick={handleCreateTransactions}
            disabled={selectedTransactions.length === 0}
          >
            Create Transaction{selectedTransactions.length > 1 ? 's' : ''}
          </Button>
          <CreateBatchDialog
            selectedTransactions={selectedTransactions}
            onBatchCreated={handleBatchCreated}
            buttonLabel="Create Batch & Save"
          /> */}
        </div>

        {/* Conditional rendering based on active tab */}
        {activeTab === 'transaction' ? (
          <RealTimeTransactionTable
            onSelectedChange={handleSelectedChange}
            isCountMode={isCountMode}
          />
        ) : (
          <HistoryTransactionTable onSelectedChange={handleSelectedChange} />
        )}
      </div>
    </PageContainer>
  );
}
