'use client';

/**
 * TransactionForm Component
 * 
 * Reusable form for creating/editing expenses and incomes.
 * Integrates React Hook Form with Zod validation.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, incomeSchema } from '@/lib/validation/accounting';
import type { Expense, Income } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CategorySelector } from './CategorySelector';
import { PAYMENT_METHODS, EXPENSE_STATUSES, INCOME_STATUSES, EXPENSE_CATEGORIES, INCOME_SOURCES } from '@/lib/constants/accounting';
import { Loader2, Upload } from 'lucide-react';
import { useState } from 'react';

interface TransactionFormProps {
  type: 'expense' | 'income';
  initialData?: Expense | Income;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ type, initialData, onSubmit, onCancel }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const schema = type === 'expense' ? expenseSchema : incomeSchema;
  const statuses = type === 'expense' ? EXPENSE_STATUSES : INCOME_STATUSES;

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? (
      type === 'expense' ? {
        description: initialData.description,
        amount: initialData.amount,
        category: (initialData as Expense).category,
        paymentMethod: initialData.paymentMethod,
        date: initialData.date,
        status: initialData.status,
        notes: initialData.notes || '',
        receipt_url: (initialData as Expense).receipt_url || '',
      } : {
        description: initialData.description,
        amount: initialData.amount,
        source: (initialData as Income).source,
        paymentMethod: initialData.paymentMethod,
        date: initialData.date,
        status: initialData.status,
        notes: initialData.notes || '',
      }
    ) : (
      type === 'expense' ? {
        description: '',
        amount: 0,
        category: EXPENSE_CATEGORIES[0],
        paymentMethod: '',
        date: new Date(),
        status: 'pending' as const,
        notes: '',
        receipt_url: '',
      } : {
        description: '',
        amount: 0,
        source: INCOME_SOURCES[0],
        paymentMethod: '',
        date: new Date(),
        status: 'pending' as const,
        notes: '',
      }
    )
  });

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={type === 'expense' ? 'category' : 'source'}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === 'expense' ? 'Category' : 'Source'} *</FormLabel>
              <FormControl>
                <CategorySelector
                  type={type}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === 'expense' && (
          <FormField
            control={form.control}
            name="receipt_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt URL</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input placeholder="https://..." {...field} />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update' : 'Create'} {type === 'expense' ? 'Expense' : 'Income'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
