import { Tag } from '@/constants/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/components/tables/transactions-tables/columns';
import axios from 'axios';

// Configure axios defaults
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface TagsResponse {
  data: {
    data: Tag[];
    meta: {
      total: number;
    };
  };
}

interface TransactionResponse {
  transactions: Transaction[];
  totalTransactions: number;
  pageCount: number;
}

export interface TransactionQuery {
  Tag: string;
  DeviceNo: number;
  AntennaNo: number;
  batchId: number;
  Timestamp: string;
  ScanCount: number;
}

export function useTransactionQuery(page: number, pageLimit: number) {
  const queryClient = useQueryClient();

  return useQuery<TransactionResponse>({
    queryKey: ['transactions', page],
    queryFn: () => fetchTransactions(page, pageLimit)
  });
}

interface TransactionData {
  Tag: string;
  DeviceNo: number;
  AntennaNo: number;
  Timestamp: string;
  ScanCount: number;
  mode?: string;
}

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: TransactionData) => {
      const response = await api.post('/api/v1/transaction/add', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export function useMutationTx() {
  return useMutation({
    mutationFn: async (data: TransactionQuery) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HUB}/transaction/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!res.ok) {
        throw new Error('Failed to process transaction');
      }

      return await res.json();
    },
    onSuccess: (data) => {
      console.log('Transaction processed successfully:', data);
    },
    onError: (error) => {
      console.error('Error processing transaction:', error);
    }
  });
}

export async function fetchTransactions(page: number, pageLimit: number): Promise<TransactionResponse> {
  const response = await api.get(`/api/v1/transaction/list?page=${page}&perPage=${pageLimit}`);
  const data = response.data;
  
  return {
    transactions: data.data,
    totalTransactions: data.meta.total,
    pageCount: Math.ceil(data.meta.total / pageLimit)
  };
}

export interface BulkTransactionData {
  transactions: {
    epc: string;
    rssi: string;
    timestamp: string;
    mode: string;
    count?: number;
  }[];
}

export const useSaveTransactionsBulk = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BulkTransactionData) => {
      const response = await fetch('/api/transaction/save-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save transactions');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
