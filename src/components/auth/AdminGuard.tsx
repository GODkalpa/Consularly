"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>Current user: {user.email}</p>
              <p>Role: User</p>
            </div>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
