'use client';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { TagForm } from '@/components/forms/tag-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTagQuery } from '@/lib/queries/tags';
import { useParams } from 'next/navigation';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Tag', link: '/dashboard/inventory/tags' },
  { title: 'Edit', link: '/dashboard/inventory/tag/edit' }
];

export default function Page() {
  const { tag } = useParams();
  const tagId = Array.isArray(tag) ? tag[0] : tag;

  const { data: tagData, isLoading, isError } = useTagQuery(tagId);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError || !tagData) {
    return <p>Tag not found.</p>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex-1 space-y-4 p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <TagForm initialData={tagData} />
      </div>
    </ScrollArea>
  );
}
