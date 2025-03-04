import { useQuery } from '@tanstack/react-query';

export interface BatchResponse {
  statusCode: number;
  message: string;
  data: Data;
}

export interface Data {
  data: BatchData[];
  meta: Meta;
}

export interface BatchData {
  id: number;
  name: string;
  createdAt: string;
}

export interface Meta {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: any;
  next: any;
}

export function useBatchQuery(page: number, pageLimit: number) {
  return useQuery({
    queryKey: ['batch', page, pageLimit],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HUB}/batch/list?page=${page}&perPage=${pageLimit}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = (await res.json()) as BatchResponse;

      return {
        batch: data.data.data,
        totalTransactions: data.data.meta.total,
        pageCount: Math.ceil(data.data.meta.total / pageLimit)
      };
    }
  });
}
