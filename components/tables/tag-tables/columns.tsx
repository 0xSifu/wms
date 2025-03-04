'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Tag>[] = [
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
    accessorKey: 'tag',
    header: 'TAG'
  },
  {
    accessorKey: 'tagName',
    header: 'TAG NAME'
  },
  {
    accessorKey: 'deviceNo',
    header: 'DEVICE NO.'
  },
  {
    accessorKey: 'antennaNo',
    header: 'ANTENNA NO.'
  },
  {
    accessorKey: 'scanCount',
    header: 'SCAN COUNT'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
