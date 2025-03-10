/**
 * Utility functions for generating dummy RFID transaction data for testing purposes.
 */

import { TransactionEvent } from '@/components/tables/transactions-tables/columns';

/**
 * Generates a random EPC (Electronic Product Code) in the format 'E280116060000{random 8 digits}'
 * @returns {string} A random EPC
 */
export function generateRandomEPC(): string {
  const randomDigits = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0');
  return `E280116060000${randomDigits}`;
}

/**
 * Generates a random RSSI (Received Signal Strength Indicator) value between -70 and -30 dBm
 * @returns {string} A random RSSI value
 */
export function generateRandomRSSI(): string {
  return (-Math.floor(Math.random() * 40 + 30)).toString();
}

/**
 * Generates a random mode from predefined options
 * @returns {string} A random mode
 */
export function generateRandomMode(): string {
  const modes = ['INVENTORY', 'PORTAL', 'HANDHELD'];
  return modes[Math.floor(Math.random() * modes.length)];
}

/**
 * Generates a single dummy RFID transaction event
 * @returns {TransactionEvent} A dummy transaction event
 */
export function generateDummyTransaction(): TransactionEvent {
  return {
    timestamp: new Date().toISOString(),
    epc: generateRandomEPC(),
    rssi: generateRandomRSSI(),
    mode: generateRandomMode(),
    isTemp: true
  };
}

/**
 * Simulates continuous RFID tag readings at specified intervals
 * @param {number} interval - Interval between readings in milliseconds
 * @param {(transaction: TransactionEvent) => void} callback - Callback function to handle the generated transaction
 * @returns {() => void} A cleanup function to stop the simulation
 */
export function startDummyDataSimulation(
  interval: number = 2000,
  callback: (transaction: TransactionEvent) => void
): () => void {
  const timerId = setInterval(() => {
    const dummyTransaction = generateDummyTransaction();
    callback(dummyTransaction);
  }, interval);

  return () => clearInterval(timerId);
}
