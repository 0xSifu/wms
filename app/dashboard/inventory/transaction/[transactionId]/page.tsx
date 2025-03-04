'use client';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { TagForm } from '@/components/forms/tag-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchTagData } from '@/lib/fetch-tag';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Transaction', link: '/dashboard/inventory/transactions' },
  { title: 'Edit', link: '/dashboard/inventory/transaction/edit' }
];

export default function Page() {
  const { transaction } = useParams();
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const transactionId = Array.isArray(transaction)
    ? transaction[0]
    : transaction;

  useEffect(() => {
    const fetchData = async () => {
      if (!transactionId) return;

      console.log('Fetching data for tagId:', transactionId);
      try {
        const data = await fetchTagData(transactionId);
        setTransactionData(data);
      } catch (error) {
        console.error('Failed to fetch tag data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transactionId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!transactionData) {
    return <p>Tag not found.</p>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex-1 space-y-4 p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <TagForm initialData={transactionData} />
      </div>
    </ScrollArea>
  );
}
