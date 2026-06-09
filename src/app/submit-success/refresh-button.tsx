'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';

interface RefreshButtonProps {
  status: 'draft' | 'pending' | 'evaluating' | 'completed' | 'failed';
}

export default function RefreshButton({ status }: RefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(5);
  const isPolling = status === 'pending' || status === 'evaluating';

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Tick the countdown every second while polling
  useEffect(() => {
    if (!isPolling) return;

    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPolling]);

  // Trigger refresh when countdown hits 0, then reset it
  useEffect(() => {
    if (!isPolling || countdown !== 0) return;

    handleRefresh();
    setCountdown(5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, isPolling]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
      >
        <RefreshCcw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
        {isPending ? 'Refreshing...' : 'Refresh Status'}
      </button>

      {isPolling && (
        <span className="text-[10px] text-slate-400 font-medium animate-pulse">
          Auto-checking in {countdown}s...
        </span>
      )}
    </div>
  );
}
