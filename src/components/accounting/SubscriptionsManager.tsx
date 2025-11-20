'use client';

import { useState } from 'react';
import { useSubscriptions } from '@/hooks/useAccounting';
import type { Subscription } from '@/types/accounting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUBSCRIPTION_STATUS_COLORS } from '@/lib/constants/accounting';
import { Plus, DollarSign, Loader2 } from 'lucide-react';

export function SubscriptionsManager() {
  const [activeTab, setActiveTab] = useState<string>('active');
  const { data: subscriptions, loading, error } = useSubscriptions(activeTab);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateMRR = () => {
    if (!subscriptions) return 0;
    return subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        if (s.billingCycle === 'monthly') return sum + s.amount;
        if (s.billingCycle === 'yearly') return sum + (s.amount / 12);
        return sum;
      }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscriptions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              MRR: <span className="font-semibold text-green-600">{formatCurrency(calculateMRR())}</span>
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">{error}</div>
            ) : !subscriptions || subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No subscriptions found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.customerName}</TableCell>
                      <TableCell>{subscription.planName}</TableCell>
                      <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                      <TableCell className="capitalize">{subscription.billingCycle}</TableCell>
                      <TableCell>{formatDate(subscription.renewalDate)}</TableCell>
                      <TableCell>
                        <Badge className={SUBSCRIPTION_STATUS_COLORS[subscription.status as keyof typeof SUBSCRIPTION_STATUS_COLORS]}>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Record Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
