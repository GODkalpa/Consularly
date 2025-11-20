'use client';

/**
 * CategorySelector Component
 * 
 * Dropdown selector for expense categories or income sources.
 * Uses predefined constants for consistent categorization.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '@/lib/constants/accounting';

interface CategorySelectorProps {
  type: 'expense' | 'income';
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CategorySelector({ type, value, onChange, disabled }: CategorySelectorProps) {
  const options = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_SOURCES;
  const label = type === 'expense' ? 'Category' : 'Source';

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
