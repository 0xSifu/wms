interface Transaction {
  id: string;
  epc: string;
  rssi: string;
  mode: string;
  timestamp: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchTagData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_HUB;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_API_HUB environment variable is not set.');
    }

    // First, get transactions
    const transactionsResponse = await fetch(`${baseUrl}/api/v1/transaction/all`);
    const transactionsResult = await transactionsResponse.json();

    if (!transactionsResponse.ok) {
      throw new Error(transactionsResult.message || `HTTP error! Status: ${transactionsResponse.status}`);
    }

    if (!Array.isArray(transactionsResult.data)) {
      throw new Error('Invalid API response format: transactions array not found.');
    }

    // Get unique EPCs from transactions
    const transactions = transactionsResult.data as Transaction[];
    const uniqueEpcs = Array.from(new Set(transactions.map(t => t.epc)));

    // Map transactions to tag format
    return uniqueEpcs.map((epc: string) => ({
      id: epc, // Using EPC as ID since it's unique
      tag: epc, // EPC is the tag code
      tagName: `Tag ${epc}` // Using EPC as tag name for now
    }));
  } catch (error) {
    console.error('Error in fetchTagData:', error);
    throw error;
  }
}
