import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Transaction } from './columns';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface HistoryTransactionTableProps {
  onSelectedChange: (transactions: Transaction[]) => void;
}

// Add pagination interface
interface PaginationResult<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

const fetchHistoryTransactions = async (
  page: number,
  limit: number
): Promise<PaginationResult<Transaction>> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001';

  const response = await axios.get(
    `${baseUrl}/api/v1/transaction?page=${page}&limit=${limit}`,
    {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    }
  );

  if (!response.data || !response.data.data) {
    throw new Error('Failed to fetch transaction history');
  }

  // Extract pagination metadata if available
  const meta = {
    currentPage: page,
    totalItems: response.data.totalItems || response.data.data.length,
    itemsPerPage: limit,
    totalPages:
      response.data.totalPages || Math.ceil(response.data.data.length / limit)
  };

  const transactions = response.data.data.map((item: any) => ({
    id: item.id,
    epc: item.epc,
    rssi: item.rssi,
    timestamp: item.timestamp,
    mode: item.mode,
    batchId: item.batchId
  }));

  return { data: transactions, meta };
};

export function HistoryTransactionTable({
  onSelectedChange
}: HistoryTransactionTableProps) {
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  // Fetch transaction history using React Query with pagination
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['transactionHistory', currentPage, pageSize],
    queryFn: () => fetchHistoryTransactions(currentPage, pageSize),
    staleTime: 60000 // 1 minute
    // keepPreviousData: true // Keep previous data while loading new data
  });

  const transactions = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  // When selected rows change, notify parent component
  useEffect(() => {
    onSelectedChange(selectedRows);
  }, [selectedRows, onSelectedChange]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedRows([]);
  }, [currentPage, pageSize]);

  const handleRowSelect = (transaction: Transaction, checked: boolean) => {
    const updatedSelection = checked
      ? [...selectedRows, transaction]
      : selectedRows.filter((t) => t.id !== transaction.id);

    setSelectedRows(updatedSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? [...transactions] : [];
    setSelectedRows(newSelection);
  };

  // Pagination handlers
  const goToNextPage = () => {
    // Always allow going to the next page, even if we're at what we think is the last page
    // The API will handle returning empty data if there are no more pages
    setCurrentPage((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Add this function to display page information more clearly
  const renderPageInfo = () => {
    if (isLoading && !data) {
      return 'Loading...';
    }

    // Display more comprehensive pagination information
    const totalItems = data?.meta?.totalItems || 0;
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return (
      <span className="text-sm text-muted-foreground">
        {totalItems > 0
          ? `Showing ${start}-${end} of ${totalItems} transactions`
          : 'No transactions found'}
      </span>
    );
  };

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between bg-muted/20 p-2">
        <span className="text-sm text-muted-foreground">
          Transaction History
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </div>

      {isError && (
        <div className="p-4 text-center text-red-500">
          Error loading transaction history:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4">
              <Checkbox
                checked={
                  selectedRows.length > 0 &&
                  selectedRows.length === transactions.length &&
                  transactions.length > 0
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
            <th className="px-4 text-left">Batch ID</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="h-24 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                <p className="mt-2">Loading transaction history...</p>
              </td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="h-24 text-center">
                No transaction history found.
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
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
                    {transaction.batchId ? (
                      <Badge variant="outline">{transaction.batchId}</Badge>
                    ) : (
                      <span className="text-muted-foreground">No batch</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="flex items-center gap-2">
          {renderPageInfo()}
          <select
            className="rounded border p-1 text-sm"
            value={pageSize}
            onChange={handlePageSizeChange}
            aria-label="Items per page"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="px-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={isLoading} // Only disable during loading, not based on page count
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
