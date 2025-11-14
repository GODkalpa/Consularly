"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Simplified DataTable component without heavy dependencies
// This replaces the complex DataTable to eliminate bundle bloat

interface SimpleColumn<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
}

interface SimpleDataTableProps<T> {
  columns: SimpleColumn<T>[]
  data: T[]
}

export function DataTable<T>({ columns, data }: SimpleDataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {column.cell 
                    ? column.cell(item)
                    : column.accessorKey 
                    ? String(item[column.accessorKey])
                    : ''
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
