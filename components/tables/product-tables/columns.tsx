'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'productName',
    header: 'PRODUCT NAME'
  },
  {
    accessorKey: 'productCode',
    header: 'PRODUCT CODE'
  },
  {
    accessorKey: 'productType',
    header: 'TYPE'
  },
  {
    accessorKey: 'unit',
    header: 'UNIT'
  },
  {
    accessorKey: 'tagId',
    header: 'TAG'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
