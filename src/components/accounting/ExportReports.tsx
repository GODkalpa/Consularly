'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateRange } from '@/types/accounting';
import { Download, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface ExportReportsProps {
  dateRange?: DateRange;
}

export function ExportReports({ dateRange }: ExportReportsProps) {
  const [exportType, setExportType] = useState<string>('expenses');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const token = await auth.currentUser?.getIdToken();
      
      const params = new URLSearchParams({ type: exportType });
      if (dateRange?.start) params.append('start', dateRange.start.toISOString());
      if (dateRange?.end) params.append('end', dateRange.end.toISOString());

      const response = await fetch(`/api/admin/accounting/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={exportType} onValueChange={setExportType}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="expenses">Expenses</SelectItem>
          <SelectItem value="incomes">Incomes</SelectItem>
          <SelectItem value="subscriptions">Subscriptions</SelectItem>
          <SelectItem value="financial-report">Financial Report</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleExport} disabled={isExporting}>
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Export
      </Button>
    </div>
  );
}
