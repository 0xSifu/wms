import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Transaction } from '@/components/tables/transactions-tables/columns';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

interface CreateBatchDialogProps {
  selectedTransactions: Transaction[];
  onBatchCreated: () => void;
  buttonLabel?: string;
}

export function CreateBatchDialog({ 
  selectedTransactions, 
  onBatchCreated,
  buttonLabel = "Create Batch" 
}: CreateBatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedTransactionIds, setSavedTransactionIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Configure axios for direct API calls
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Batch name is required",
        variant: "destructive"
      });
      return;
    }
    
    // Get the selected transactions from localStorage
    let transactionsToProcess = selectedTransactions;
    
    if (selectedTransactions.length === 0 && typeof window !== 'undefined') {
      try {
        const storedTransactions = localStorage.getItem('selectedTransactions');
        if (storedTransactions) {
          transactionsToProcess = JSON.parse(storedTransactions);
        }
      } catch (error) {
        console.error('Error parsing stored transactions:', error);
      }
    }
    
    if (transactionsToProcess.length === 0) {
      toast({
        title: "No Transactions Selected",
        description: "Please select at least one transaction to create a batch",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Clear previous saved transaction IDs
      setSavedTransactionIds([]);
      
      // First save all transactions and collect their UUIDs
      const newTransactionIds: string[] = [];
      const errors = [];
      
      // Process transactions sequentially to maintain order
      for (const transaction of transactionsToProcess) {
        try {
          // Skip transactions that already have a non-temporary ID
          if (transaction.id && !transaction.isTemp) {
            newTransactionIds.push(transaction.id.toString());
            continue;
          }
          
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
          
          // Send to the backend API and wait for response
          const response = await api.post('/api/v1/transaction', apiTransaction);
          
          if (response.data?.data?.id) {
            // Store the UUID from the response
            newTransactionIds.push(response.data.data.id);
          } else {
            console.log('API Response:', response.data);
            throw new Error('Transaction created but no ID returned');
          }
        } catch (error) {
          console.error('Error saving transaction:', error);
          errors.push({
            transaction,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Update state with collected UUIDs
      setSavedTransactionIds(newTransactionIds);
      
      if (newTransactionIds.length === 0) {
        throw new Error('Failed to save any transactions');
      }

      console.log('Transaction UUIDs to be added to batch:', newTransactionIds);
      
      // Now create the batch with the collected UUIDs
      const batchData = {
        name,
        description,
        transactionIds: newTransactionIds
      };
      
      // Create the batch with the collected UUIDs
      const batchResponse = await api.post('/api/v1/batch', batchData);
      
      // Show success message
      toast({
        title: "Batch Created",
        description: `Successfully created batch "${name}" with ${newTransactionIds.length} transactions${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
        variant: errors.length === 0 ? "default" : "destructive"
      });
      
      // Clear localStorage after successful processing
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedTransactions');
      }
      
      // Close dialog and notify parent
      setOpen(false);
      onBatchCreated();
      
      // Reset form
      setName('');
      setDescription('');
      setSavedTransactionIds([]);
      
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create batch',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          disabled={selectedTransactions.length === 0}
        >
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter batch name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter batch description"
              rows={3}
            />
          </div>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-2">
              Creating a batch with {selectedTransactions.length} selected transaction{selectedTransactions.length !== 1 ? 's' : ''}
            </p>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}