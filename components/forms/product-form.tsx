'use client';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Trash } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '../ui/use-toast';

export const IMG_MAX_LIMIT = 3;
const formSchema = z.object({
  productName: z
    .string()
    .min(3, { message: 'Product Name must be at least 3 characters' }),
  productCode: z.string().min(1, { message: 'Product Code is required' }),
  productType: z.string().min(1, { message: 'Product Type is required' }),
  unit: z.coerce.number().min(1, { message: 'Unit must be at least 1' }),
  tagId: z.string().min(1, { message: 'Please select a tag' }) // Add tagId validation
});

export type Product = {
  id: string;
  productName: string;
  productCode: string;
  productType: string;
  unit: number;
  tagId: string;
};

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData: Product | null;
  categories: any;
}

// Add this new function to fetch transaction data and extract unique EPCs
const fetchTransactionEPCs = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_HUB;
  if (!baseUrl) {
    throw new Error('API URL is not configured');
  }

  const response = await fetch(
    `${baseUrl}/api/v1/transaction?page=1&limit=100`,
    {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result = await response.json();

  // Extract unique EPCs
  const uniqueEpcs = Array.from(
    new Set(result.data.map((transaction: any) => transaction.epc))
  ).map((epc) => ({
    id: epc, // Use EPC as the ID
    tag: epc // Use EPC as the display text
  }));

  return uniqueEpcs;
};

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories
}) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const title = initialData ? 'Edit product' : 'Create product';
  const description = initialData ? 'Edit a product.' : 'Add a new product.';
  const action = initialData ? 'Save changes' : 'Create';

  const defaultValues = initialData
    ? { ...initialData }
    : {
        productName: '',
        productCode: '',
        productType: '',
        unit: 1,
        tagId: ''
      };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace fetchTagData with our new function
        const uniqueEpcs = await fetchTransactionEPCs();
        setTags(uniqueEpcs);
      } catch (error) {
        console.error('Failed to fetch transaction data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to load transaction tags'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);

      const payload = {
        productName: data.productName,
        productCode: data.productCode,
        productType: data.productType,
        unit: data.unit,
        tagId: data.tagId // This will now be the EPC from the transaction
      };

      const baseUrl = process.env.NEXT_PUBLIC_API_HUB;
      if (!baseUrl) {
        throw new Error('API URL is not configured');
      }

      const apiUrl = `${baseUrl}/api/v1/product${
        initialData ? `/${initialData.id}` : ''
      }`;
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! Status: ${response.status}`
        );
      }

      if (!result.data) {
        throw new Error('Invalid response from server');
      }

      router.refresh();
      router.push(`/dashboard/inventory/products`);
      toast({
        title: 'Success',
        description: `Product ${
          initialData ? 'updated' : 'created'
        } successfully.`
      });
    } catch (error) {
      console.error('Failed to submit product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save product'
      });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);

      if (!initialData?.id) {
        throw new Error('No product ID provided for deletion');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_HUB;
      if (!baseUrl) {
        throw new Error('API URL is not configured');
      }

      const response = await fetch(
        `${baseUrl}/api/v1/product/${initialData.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to delete product`);
      }

      router.refresh();
      router.push(`/dashboard/inventory/products`);
      toast({
        title: 'Success',
        description: 'Product deleted successfully.'
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete product'
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-8"
        >
          <div className="gap-8 md:grid md:grid-cols-3">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Product name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Product code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Product type"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={loading}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Tag (EPC)</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder="Select a transaction tag"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {loading ? (
              <>{initialData ? 'Saving...' : 'Creating...'}</>
            ) : (
              action
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};
