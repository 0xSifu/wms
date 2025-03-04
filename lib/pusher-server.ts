/**
 * Mock implementation of the Pusher server-side client
 * This is used as a replacement for the actual Pusher package
 */

import { PUSHER_CONSTANTS } from './pusher';

interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
  useTLS: boolean;
}

class MockPusher {
  private config: PusherConfig;

  constructor(config: PusherConfig) {
    this.config = config;
    console.log('MockPusher initialized with config:', config);
  }

  /**
   * Mock implementation of the trigger method
   * In a real implementation, this would send an event to the Pusher service
   */
  async trigger(
    channelName: string,
    eventName: string,
    data: any
  ): Promise<{ success: boolean }> {
    console.log(`MockPusher.trigger called with:`, {
      channelName,
      eventName,
      data
    });

    // In a real implementation, this would make an HTTP request to Pusher
    // For now, we'll just simulate a successful response
    return { success: true };
  }
}

export default MockPusher; 