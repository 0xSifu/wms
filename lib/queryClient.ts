import { QueryClient } from '@tanstack/react-query';
import { getSession } from 'next-auth/react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const session = await getSession();
        const res = await fetch(`/api/${queryKey[0]}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`
          }
        });
        return res.json();
      }
    }
  }
});
