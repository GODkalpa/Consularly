'use client';

/**
 * useAccounting Hooks
 * 
 * Custom hooks for accessing accounting data throughout the admin dashboard.
 * Provides automatic fetching, caching, and helper methods for expenses, incomes,
 * subscriptions, invoices, and financial metrics.
 */

import { useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import type { 
  Expense, 
  Income, 
  Subscription, 
  Invoice, 
  FinancialSummary 
} from '@/types/accounting';

interface DateRange {
  start: Date;
  end: Date;
}

interface UseAccountingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramStr}`;
}

function getFromCache<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Hook to fetch expenses with date range filtering
 */
export function useExpenses(
  dateRange?: DateRange,
  category?: string,
  status?: string
): UseAccountingResult<Expense[]> {
  const [data, setData] = useState<Expense[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange?.start) params.append('start', dateRange.start.toISOString());
      if (dateRange?.end) params.append('end', dateRange.end.toISOString());
      if (category) params.append('category', category);
      if (status) params.append('status', status);

      const endpoint = `/api/admin/accounting/expenses?${params.toString()}`;
      const cacheKey = getCacheKey(endpoint);

      // Check cache first (60 second TTL)
      const cached = getFromCache<Expense[]>(cacheKey, 60000);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch expenses');
      }

      const expenses = await response.json();
      setCache(cacheKey, expenses);
      setData(expenses);
    } catch (e: any) {
      console.error('[useExpenses] Error:', e);
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange, category, status]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { data, loading, error, refetch: fetchExpenses };
}

/**
 * Hook to fetch incomes with date range filtering
 */
export function useIncomes(
  dateRange?: DateRange,
  source?: string,
  status?: string
): UseAccountingResult<Income[]> {
  const [data, setData] = useState<Income[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange?.start) params.append('start', dateRange.start.toISOString());
      if (dateRange?.end) params.append('end', dateRange.end.toISOString());
      if (source) params.append('source', source);
      if (status) params.append('status', status);

      const endpoint = `/api/admin/accounting/incomes?${params.toString()}`;
      const cacheKey = getCacheKey(endpoint);

      // Check cache first (60 second TTL)
      const cached = getFromCache<Income[]>(cacheKey, 60000);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch incomes');
      }

      const incomes = await response.json();
      setCache(cacheKey, incomes);
      setData(incomes);
    } catch (e: any) {
      console.error('[useIncomes] Error:', e);
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange, source, status]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  return { data, loading, error, refetch: fetchIncomes };
}

/**
 * Hook to fetch subscriptions with status filtering
 */
export function useSubscriptions(
  status?: string
): UseAccountingResult<Subscription[]> {
  const [data, setData] = useState<Subscription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const endpoint = `/api/admin/accounting/subscriptions?${params.toString()}`;
      const cacheKey = getCacheKey(endpoint);

      // Check cache first (5 minute TTL)
      const cached = getFromCache<Subscription[]>(cacheKey, 300000);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscriptions');
      }

      const subscriptions = await response.json();
      setCache(cacheKey, subscriptions);
      setData(subscriptions);
    } catch (e: any) {
      console.error('[useSubscriptions] Error:', e);
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return { data, loading, error, refetch: fetchSubscriptions };
}

/**
 * Hook to fetch invoices with status filtering
 */
export function useInvoices(
  status?: string
): UseAccountingResult<Invoice[]> {
  const [data, setData] = useState<Invoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const endpoint = `/api/admin/accounting/invoices?${params.toString()}`;
      const cacheKey = getCacheKey(endpoint);

      // Check cache first (5 minute TTL)
      const cached = getFromCache<Invoice[]>(cacheKey, 300000);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invoices');
      }

      const invoices = await response.json();
      setCache(cacheKey, invoices);
      setData(invoices);
    } catch (e: any) {
      console.error('[useInvoices] Error:', e);
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { data, loading, error, refetch: fetchInvoices };
}

/**
 * Hook to fetch financial metrics summary
 */
export function useFinancialMetrics(
  dateRange?: DateRange
): UseAccountingResult<FinancialSummary> {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange?.start) params.append('start', dateRange.start.toISOString());
      if (dateRange?.end) params.append('end', dateRange.end.toISOString());

      const endpoint = `/api/admin/accounting/financial-summary?${params.toString()}`;
      const cacheKey = getCacheKey(endpoint);

      // Check cache first (30 second TTL)
      const cached = getFromCache<FinancialSummary>(cacheKey, 30000);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch financial metrics');
      }

      const metrics = await response.json();
      setCache(cacheKey, metrics);
      setData(metrics);
    } catch (e: any) {
      console.error('[useFinancialMetrics] Error:', e);
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, loading, error, refetch: fetchMetrics };
}

/**
 * Hook to fetch charts data
 */
export function useChartsData(
  dateRange?: DateRange
): UseAccountingResult<{
  monthlyIncomeVsExpense: Array<{ month: string; income: number; expense: number; netProfit: number }>;
  expenseBreakdown: Array<{ category: string; amount: number }>;
  incomeBreakdown: Array<{ source: string; amount: number }>;
}> {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange?.start) params.append('start', dateRange.start.toISOString());
      if (dateRange?.end) params.append('end', dateRange.end.toISOString());

      const endpoint = `/api/admin/accounting/charts-data?${params.toString()}`;
      const cacheKey = getCacheKey(endpoint);

      // Check cache first (5 minute TTL)
      const cached = getFromCache<any>(cacheKey, 300000);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch charts data');
      }

      const chartsData = await response.json();
      setCache(cacheKey, chartsData);
      setData(chartsData);
    } catch (e: any) {
      console.error('[useChartsData] Error:', e);
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchChartsData();
  }, [fetchChartsData]);

  return { data, loading, error, refetch: fetchChartsData };
}
