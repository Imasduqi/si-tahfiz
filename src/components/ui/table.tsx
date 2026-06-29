import React from 'react'
import { cn } from '@/lib/utils'
import { SkeletonTable } from './loading-skeleton'
import { EmptyState } from './empty-state'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TableColumn<T = any> {
  key: string
  header: React.ReactNode
  render?: (item: T, index: number) => React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  isLoading?: boolean
  empty?: {
    title?: string
    description: string
    action?: React.ReactNode
  } | string
  className?: string
}

export function Table({
  columns,
  data,
  isLoading,
  empty,
  className,
}: TableProps) {
  if (isLoading) {
    return <SkeletonTable />
  }

  if (!data || data.length === 0) {
    const emptyTitle = typeof empty === 'object' ? empty.title : 'Belum ada data'
    const emptyDesc = typeof empty === 'object' ? empty.description : (typeof empty === 'string' ? empty : 'Tidak ada data untuk ditampilkan')
    const emptyAction = typeof empty === 'object' ? empty.action : undefined

    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDesc}
        action={emptyAction}
      />
    )
  }

  return (
    <div className={cn("w-full overflow-x-auto border border-[#E5E7EB] rounded-lg", className)}>
      <table className="w-full border-collapse text-left text-[14px] text-[#111827]">
        <thead className="bg-[#F3F4F6] text-[#374151] font-semibold">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold text-left border-b border-[#E5E7EB] select-none text-[14px]">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#E5E7EB]">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-0"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[#111827] text-[14px] align-middle whitespace-nowrap">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {col.render ? col.render(row, rowIndex) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
