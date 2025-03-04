import { NextResponse } from 'next/server';
import axios from 'axios';

// Configure axios defaults
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Map the transaction data to the expected format
    const transactionData = {
      Tag: body.epc,
      DeviceNo: body.deviceNo || 1, // Default to 1 if not provided
      AntennaNo: body.antennaNo || 1, // Default to 1 if not provided
      Timestamp: body.timestamp,
      ScanCount: body.count || 1,
      mode: body.mode
    };

    // Send the data to the backend API
    const response = await api.post('/api/v1/transaction/add', transactionData);
    
    return NextResponse.json({ 
      success: true, 
      data: response.data,
      message: 'Transaction saved successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving transaction:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save transaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 