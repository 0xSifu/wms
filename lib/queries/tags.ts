import { Tag } from '@/constants/data';
import { useQuery } from '@tanstack/react-query';

export function useTagQuery(tagId: string) {
  return useQuery({
    queryKey: ['tag', tagId],
    queryFn: async () => {
      console.log('Fetching tag data for ID:', tagId);

      const baseUrl = process.env.NEXT_PUBLIC_API_HUB;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_HUB environment variable is not set.');
      }

      const url = `${baseUrl}/tag/list?page=1&perPage=10&q=${encodeURIComponent(
        tagId
      )}`;
      console.log('Constructed URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API result:', result);

      const tags = result.data?.data;
      if (!Array.isArray(tags)) {
        throw new Error('Invalid API response format: tags array not found.');
      }

      const tagData = tags.find((tag) => tag.tag === tagId);
      if (!tagData) {
        throw new Error('Tag not found in the response data.');
      }

      console.log('Extracted tag data:', tagData);
      return tagData;
    }
  });
}

interface TagsResponse {
  data: {
    data: Tag[];
    meta: {
      total: number;
    };
  };
}

export function useTagsList(page: number, pageLimit: number) {
  return useQuery({
    queryKey: ['tags', page, pageLimit],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HUB}/tag/list?page=${page}&perPage=${pageLimit}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = (await res.json()) as TagsResponse;
      console.log('Data : ', data);

      return {
        tags: data.data.data,
        totalTags: data.data.meta.total,
        pageCount: Math.ceil(data.data.meta.total / pageLimit)
      };
    }
  });
}
