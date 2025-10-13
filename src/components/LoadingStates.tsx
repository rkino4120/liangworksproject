'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
      <span className="text-slate-600">読み込み中...</span>
    </div>
  </div>
);

export const ErrorMessage = ({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void; 
}) => (
  <div className="flex justify-center py-12">
    <Card className="max-w-md w-full">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">エラーが発生しました</h3>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              再試行
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);
