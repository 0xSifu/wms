'use client';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

export function QuickActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [epc, setEpc] = useState("");
  const [rssi, setRssi] = useState("-50.00"); // Default RSSI value
  const { toast } = useToast();

  const handleCreateTransaction = async () => {
    if (!epc) {
      toast({
        title: "Error",
        description: "EPC is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HUB || 'http://localhost:9001'}/api/v1/transaction`,
        {
          epc,
          rssi,
          mode: "manual",
          timestamp: new Date().toISOString(),
        }
      );

      toast({
        title: "Success",
        description: `Transaction created with EPC: ${epc}`,
      });

      // Reset form and close dialog
      setEpc("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* <Button
        onClick={() => router.push('/dashboard/inventory/batch/new')}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Add Batch
      </Button>

      <Button
        onClick={() => router.push('/dashboard/inventory/tags/new')}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Add Tag
      </Button> */}

      <Button
        onClick={() => router.push('/dashboard/inventory/products/new')}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Add Product
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Create Transaction
          </Button>
        </DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Transaction</DialogTitle>
            <DialogDescription>
              Enter the EPC and RSSI values for the new transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="epc" className="text-right">
                EPC
              </Label>
              <Input
                id="epc"
                value={epc}
                onChange={(e) => setEpc(e.target.value)}
                placeholder="Enter EPC"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rssi" className="text-right">
                RSSI
              </Label>
              <Input
                id="rssi"
                value={rssi}
                onChange={(e) => setRssi(e.target.value)}
                placeholder="-50.00"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransaction}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 