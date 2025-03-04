import { NextResponse } from 'next/server';
import MockPusher from '@/lib/pusher-server';
import { PUSHER_CONSTANTS } from '@/lib/pusher';
import axios from 'axios';

// Initialize Pusher server-side client with mock implementation
const pusher = new MockPusher({
  appId: process.env.PUSHER_APP_ID || '1723848',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '41a1ec9bc21c0ec74674',
  secret: process.env.PUSHER_SECRET || 'a8e42d5c7e3a5e8c5a8e',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});

// Configure axios defaults
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    if (!body.transactions || !Array.isArray(body.transactions) || body.transactions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: transactions array is required' },
        { status: 400 }
      );
    }
    
    // Log the received bulk transaction data
    console.log(`Processing ${body.transactions.length} transactions`);
    
    // Process each transaction
    const results = [];
    const errors = [];
    
    for (const transaction of body.transactions) {
      try {
        // Convert to the format expected by the API
        const apiTransaction = {
          epc: transaction.epc,
          rssi: transaction.rssi,
          timestamp: transaction.timestamp,
          deviceNo: 1,
          antennaNo: 1,
          scanCount: transaction.count || 1,
          mode: transaction.mode || 'single'
        };
        
        // Send the transaction to the backend API
        const response = await api.post('/transaction/add', apiTransaction);
        
        // Trigger the Pusher event for each transaction
        await pusher.trigger(
          PUSHER_CONSTANTS.CHANNEL,
          PUSHER_CONSTANTS.EVENTS.TAG_SCANNED,
          {
            timestamp: transaction.timestamp,
            epc: transaction.epc,
            rssi: transaction.rssi,
            mode: transaction.mode || 'single'
          }
        );
        
        results.push({
          success: true,
          data: response.data,
          transaction
        });
      } catch (error) {
        console.error('Error processing transaction:', error);
        errors.push({
          transaction,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Return response with results
    return NextResponse.json({
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error processing bulk transactions:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk transactions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 