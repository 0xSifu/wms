import { Tag } from '@/constants/data';
import { useQuery } from '@tanstack/react-query';

interface TagResponse {
  statusCode: number;
  message: string;
  data: {
    data: Tag[];
    meta: {
      total: number;
      lastPage: number;
      currentPage: number;
      perPage: number;
      prev: number | null;
      next: number | null;
    };
  };
}

export function useTagQuery(tagId: string) {
  return useQuery({
    queryKey: ['tag', tagId],
    queryFn: async () => {
      console.log('Fetching tag data for ID:', tagId);

      const baseUrl = process.env.NEXT_PUBLIC_API_HUB;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_HUB environment variable is not set.');
      }

      const searchQuery = tagId ? `q='${tagId}'` : "q=''";
      const url = `${baseUrl}/api/v1/tags?page=1&perPage=10&${encodeURIComponent(
        searchQuery
      )}`;
      console.log('Constructed URL:', url);

      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = (await response.json()) as TagResponse;
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
      const searchQuery = "q=''";
      const url = `${
        process.env.NEXT_PUBLIC_API_HUB
      }/api/v1/tags?page=${page}&perPage=${pageLimit}&${encodeURIComponent(
        searchQuery
      )}`;

      const res = await fetch(url, {
        headers: {
          accept: 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = (await res.json()) as TagResponse;
      console.log('Data : ', data);

      return {
        tags: data.data.data,
        totalTags: data.data.meta.total,
        pageCount: data.data.meta.lastPage
      };
    }
  });
}
