import { NextResponse } from 'next/server';
import MockPusher from '@/lib/pusher-server';
import { PUSHER_CONSTANTS } from '@/lib/pusher';

// Initialize Pusher server-side client with mock implementation
const pusher = new MockPusher({
  appId: process.env.PUSHER_APP_ID || '1723848',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '41a1ec9bc21c0ec74674',
  secret: process.env.PUSHER_SECRET || 'a8e42d5c7e3a5e8c5a8e',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Log the received event data
    console.log('Triggering test Pusher event with data:', body);
    
    // Trigger the Pusher event
    await pusher.trigger(
      PUSHER_CONSTANTS.CHANNEL,
      PUSHER_CONSTANTS.EVENTS.TAG_SCANNED,
      body
    );
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Pusher event' },
      { status: 500 }
    );
  }
} 