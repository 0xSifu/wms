'use client';

import * as z from 'zod';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { useToast } from '../ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { deepEqual } from 'assert';
import { isEqual } from 'lodash';

export type Tag = {
  id: string;
  tag: string;
  deviceNo: number;
  antennaNo: number;
  timestamp: string;
  scanCount: number;
  tagName?: string;
  quantity?: number;
  expiredDate?: Date;
  processed: boolean;
};

const formSchema = z.object({
  tag: z.string().min(1, { message: 'Tag is required' }),
  deviceNo: z.number().min(0, { message: 'Device number must be at least 0' }),
  antennaNo: z
    .number()
    .min(0, { message: 'Antenna number must be at least 0' }),
  timestamp: z.string().nonempty({ message: 'Timestamp is required' }),
  scanCount: z.number().min(0, { message: 'Scan count must be at least 0' }),
  tagName: z.string().optional(),
  quantity: z.number().optional(),
  expiredDate: z.string().optional(),
  processed: z.boolean().optional()
});

type TagFormValues = z.infer<typeof formSchema>;

interface TagFormProps {
  initialData: Tag | null;
}

export const TagForm: React.FC<TagFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const defaultValues: TagFormValues = initialData
    ? {
        tag: initialData.tag,
        deviceNo: initialData.deviceNo,
        antennaNo: initialData.antennaNo,
        timestamp: initialData.timestamp,
        scanCount: initialData.scanCount,
        tagName: initialData.tagName || '',
        quantity: initialData.quantity ?? undefined,
        expiredDate: initialData.expiredDate
          ? new Date(initialData.expiredDate).toISOString().split('T')[0]
          : undefined,
        processed: initialData.processed ?? undefined
      }
    : {
        tag: '',
        deviceNo: 0,
        antennaNo: 0,
        timestamp: '',
        scanCount: 0,
        tagName: '',
        quantity: undefined,
        expiredDate: undefined,
        processed: undefined
      };

  const form = useForm<TagFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  useEffect(() => {
    if (initialData) {
      const hasDataChanged = !isEqual(initialData, form.getValues());
      if (hasDataChanged) {
        form.reset({
          tag: initialData.tag,
          deviceNo: initialData.deviceNo,
          antennaNo: initialData.antennaNo,
          timestamp: initialData.timestamp,
          scanCount: initialData.scanCount,
          tagName: initialData.tagName || '',
          quantity: initialData.quantity ?? undefined,
          expiredDate: initialData.expiredDate
            ? new Date(initialData.expiredDate).toISOString().split('T')[0]
            : undefined,
          processed: initialData.processed ?? undefined
        });
      }
    }
  }, [initialData, form]);

  const onSubmit = async (data: TagFormValues) => {
    try {
      setLoading(true);

      //   Ensure numeric values are explicitly converted to numbers
      const deviceNo = Number(data.deviceNo);
      const antennaNo = Number(data.antennaNo);
      const scanCount = Number(data.scanCount);
      const quantity = data.quantity ? Number(data.quantity) : undefined;

      console.log('Device No : ', deviceNo);

      // Use the environment variable for the base URL
      const baseUrl = process.env.NEXT_PUBLIC_API_HUB;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_HUB environment variable is not set.');
      }

      const response = await fetch(`${baseUrl}/tag/update/${initialData?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceNo,
          antennaNo,
          timestamp: data.timestamp,
          scanCount,
          tagName: data.tagName,
          quantity,
          expiredDate: data.expiredDate,
          processed: data.processed
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update tag');
      }

      toast({
        title: 'Success',
        description: 'Tag updated successfully.'
      });
      router.push('/dashboard/inventory/tags');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title="Edit Tag" description="Update the tag details." />
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-8"
        >
          {/* Fields that are always visible */}
          <div className="space-y-8">
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag" {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deviceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device No</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Device No"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="antennaNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antenna No</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Antenna No"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timestamp</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      placeholder="Timestamp"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Scrollable fields */}
          <div className="max-h-96 space-y-8 overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Quantity"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expired Date</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="Expired Date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button disabled={loading} className="ml-auto" type="submit">
            Save Changes
          </Button>
        </form>
      </Form>
    </>
  );
};
