'use client';

/**
 * AccountingDashboard Component
 * 
 * Main container for the accounting module.
 * Provides tab navigation and date range filtering for all accounting features.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinancialOverview } from './FinancialOverview';
import { DashboardCharts } from './DashboardCharts';
import { ExpensesTable } from './ExpensesTable';
import { IncomesTable } from './IncomesTable';
import { SubscriptionsManager } from './SubscriptionsManager';
import { InvoiceManager } from './InvoiceManager';
import { ExportReports } from './ExportReports';
import type { DateRange } from '@/types/accounting';
import { Calendar } from 'lucide-react';

export function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return {
      start: startOfYear,
      end: now,
    };
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading accounting dashboard...</p>
        </div>
      </div>
    );
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev: DateRange) => ({ ...prev, start: new Date(e.target.value) }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev: DateRange) => ({ ...prev, end: new Date(e.target.value) }));
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Billing & Accounting</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage expenses, income, subscriptions, and invoices
          </p>
        </div>
        <ExportReports dateRange={dateRange} />
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <Label htmlFor="start-date" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={handleStartDateChange}
              />
            </div>
            <div className="flex-1 w-full">
              <Label htmlFor="end-date" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={handleEndDateChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="incomes">Incomes</TabsTrigger>
          <TabsTrigger value="subscriptions" className="col-span-2 sm:col-span-1">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <FinancialOverview dateRange={dateRange} />
          <DashboardCharts dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpensesTable dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="incomes" className="mt-6">
          <IncomesTable dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsManager />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoiceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
