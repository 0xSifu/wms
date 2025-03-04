export async function fetchTagData(tagId: string) {
  console.log('Fetching tag data for ID:', tagId);

  try {
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

    const tagData = tags.find((tag: any) => tag.tag === tagId);
    if (!tagData) {
      throw new Error('Tag not found in the response data.');
    }

    console.log('Extracted tag data:', tagData);

    return tagData;
  } catch (error) {
    console.error('Error in fetchTagData:', error);
    throw error;
  }
}
