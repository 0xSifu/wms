'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TransactionEvent } from '@/components/tables/transactions-tables/columns';
import { useToast } from '@/components/ui/use-toast';
import { 
  simulatePusherEvent, 
  generateRandomEpc, 
  generateRandomRssi 
} from '@/lib/pusher-client-utils';
import axios from 'axios';

export function TestEventGenerator() {
  const [epc, setEpc] = useState('E28069950000400F0B889922');
  const [rssi, setRssi] = useState('-56.90');
  const [mode, setMode] = useState('single');
  const [count, setCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Configure axios for direct API calls
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const generateEvent = async () => {
    try {
      setIsLoading(true);
      
      // Create the event data
      const baseEventData: TransactionEvent = {
        timestamp: new Date().toISOString(),
        epc,
        rssi,
        mode
      };

      // Generate the specified number of events
      const eventCount = Math.max(1, Math.min(20, count)); // Limit to 1-20 events
      let successCount = 0;
      const createdTransactions = [];

      for (let i = 0; i < eventCount; i++) {
        // Slightly modify timestamp and RSSI for each event to make them unique
        const eventData = {
          ...baseEventData,
          timestamp: new Date(Date.now() + i * 100).toISOString(),
          rssi: `${parseFloat(rssi) + (Math.random() * 0.2 - 0.1).toFixed(2)}`
        };

        try {
          // Convert to the format expected by the API
          const transactionData = {
            epc: eventData.epc,
            rssi: eventData.rssi,
            timestamp: eventData.timestamp,
            deviceNo: 1,
            antennaNo: 1,
            scanCount: 1,
            mode: eventData.mode
          };
          
          // Send to the backend API
          const response = await api.post('/api/v1/transaction/add', transactionData);
          
          if (response.data && response.data.id) {
            createdTransactions.push(response.data);
            successCount++;
            
            // Trigger client-side event for real-time updates
            simulatePusherEvent({
              ...eventData,
              id: response.data.id,
              isTemp: false
            });
          }
        } catch (error) {
          console.error('Error creating transaction:', error);
          
          // Still trigger client-side event for testing
          simulatePusherEvent({
            ...eventData,
            id: Date.now() + i,
            isTemp: true
          });
        }

        // Add a small delay between events
        if (i < eventCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // If we have transactions, try to create a batch
      if (createdTransactions.length > 0) {
        try {
          const batchData = {
            name: `Batch ${new Date().toISOString()}`,
            description: `Auto-generated batch with ${successCount} transactions`,
            transactionIds: createdTransactions.map(t => t.id)
          };
          
          const batchResponse = await api.post('/api/v1/batch', batchData);
          
          if (batchResponse.data) {
            toast({
              title: "Batch Created",
              description: `Created batch "${batchData.name}" with ${successCount} transactions`,
            });
          }
        } catch (error) {
          console.error('Error creating batch:', error);
          toast({
            title: "Batch Creation Failed",
            description: "Transactions were saved but could not be added to a batch",
            variant: "destructive"
          });
        }
      }

      // Show success message
      toast({
        title: `${successCount} Transaction${successCount !== 1 ? 's' : ''} Created`,
        description: `Successfully created ${successCount} transaction${successCount !== 1 ? 's' : ''} with EPC: ${epc}`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error generating transactions:', error);
      toast({
        title: "Error",
        description: "Failed to generate transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a random EPC
  const handleGenerateRandomEpc = () => {
    setEpc(generateRandomEpc());
  };

  // Generate a random RSSI value
  const handleGenerateRandomRssi = () => {
    setRssi(generateRandomRssi());
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Event Generator</CardTitle>
        <CardDescription>
          Generate test RFID scan events to simulate real transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="epc" className="text-right">
              EPC
            </Label>
            <Input id="epc" value={epc} onChange={(e) => setEpc(e.target.value)} className="col-span-2" />
            <Button variant="outline" onClick={handleGenerateRandomEpc}>Random</Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rssi" className="text-right">
              RSSI
            </Label>
            <Input id="rssi" value={rssi} onChange={(e) => setRssi(e.target.value)} className="col-span-2" />
            <Button variant="outline" onClick={handleGenerateRandomRssi}>Random</Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mode" className="text-right">
              Mode
            </Label>
            <select 
              id="mode" 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="single">Single</option>
              <option value="continuous">Continuous</option>
              <option value="inventory">Inventory</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="count" className="text-right">
              Count
            </Label>
            <Input 
              id="count" 
              type="number" 
              min="1" 
              max="20" 
              value={count} 
              onChange={(e) => setCount(parseInt(e.target.value) || 1)} 
              className="col-span-3"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={generateEvent} disabled={isLoading}>
          {isLoading ? "Generating..." : `Generate ${count > 1 ? count + ' Events' : 'Event'}`}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setEpc(generateRandomEpc());
            setRssi(generateRandomRssi());
            const modes = ['single', 'continuous', 'inventory'];
            setMode(modes[Math.floor(Math.random() * modes.length)]);
          }}
        >
          Randomize All
        </Button>
      </CardFooter>
    </Card>
  );
} 