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
    
    // Log the received transaction data
    console.log('Processing transaction with data:', body);
    
    // Send the transaction to the backend API
    const response = await api.post('/transaction/add', {
      epc: body.Tag || body.epc,
      rssi: body.rssi || '-50.0', // Default RSSI if not provided
      timestamp: body.Timestamp || body.timestamp,
      deviceNo: body.DeviceNo || body.deviceNo || 1,
      antennaNo: body.AntennaNo || body.antennaNo || 1,
      scanCount: body.ScanCount || body.scanCount || 1,
      mode: body.mode || 'single'
    });
    
    // Convert the API response data to the format expected by the frontend
    const transactionEvent = {
      timestamp: body.Timestamp || body.timestamp,
      epc: body.Tag || body.epc,
      rssi: body.rssi || (body.ScanCount ? body.ScanCount.toString() : '-50.0'),
      mode: body.mode || 'single'
    };
    
    // Trigger the Pusher event
    await pusher.trigger(
      PUSHER_CONSTANTS.CHANNEL,
      PUSHER_CONSTANTS.EVENTS.TAG_SCANNED,
      transactionEvent
    );
    
    // Return success response with the API response data
    return NextResponse.json({ 
      success: true,
      data: response.data,
      event: transactionEvent
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 