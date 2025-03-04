import { pusherClient, PUSHER_CONSTANTS } from './pusher';
import { TransactionEvent } from '@/components/tables/transactions-tables/columns';

/**
 * Utility to directly trigger Pusher events client-side
 * This is useful for testing without needing a server-side Pusher implementation
 */
export function simulatePusherEvent(eventData: TransactionEvent): boolean {
  console.log('Simulating Pusher event client-side:', eventData);
  
  // Get all event listeners for the tag-scanned event
  const listeners = (pusherClient as any).callbacks?.[PUSHER_CONSTANTS.EVENTS.TAG_SCANNED] || [];
  
  // Manually call each listener with our event data
  if (listeners.length > 0) {
    listeners.forEach((callback: Function) => {
      try {
        callback(eventData);
      } catch (err) {
        console.error('Error calling event listener:', err);
      }
    });
    return true;
  }
  
  return false;
}

/**
 * Generate a random EPC code
 */
export function generateRandomEpc(): string {
  const chars = '0123456789ABCDEF';
  let result = 'E2';
  for (let i = 0; i < 22; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random RSSI value
 */
export function generateRandomRssi(): string {
  const value = -(Math.floor(Math.random() * 70) + 30);
  const decimal = Math.floor(Math.random() * 100);
  return `${value}.${decimal < 10 ? '0' + decimal : decimal}`;
}

/**
 * Generate a random transaction event
 */
export function generateRandomTransactionEvent(): TransactionEvent {
  return {
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23),
    epc: generateRandomEpc(),
    rssi: generateRandomRssi(),
    mode: ['single', 'continuous', 'inventory'][Math.floor(Math.random() * 3)]
  };
} 