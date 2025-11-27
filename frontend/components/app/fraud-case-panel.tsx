'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Clock, ShieldWarning, Warning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 5000;

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  confirmed_safe: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  confirmed_fraud: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  verification_failed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

const STATUS_COPY: Record<string, string> = {
  pending_review: 'Pending',
  confirmed_safe: 'Safe',
  confirmed_fraud: 'Fraud',
  verification_failed: 'Failed',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending_review: Clock,
  confirmed_safe: ShieldCheck,
  confirmed_fraud: ShieldWarning,
  verification_failed: Warning,
};

interface FraudCase {
  id: number;
  userName: string;
  customerName: string;
  securityIdentifier: string;
  cardEnding: string;
  cardBrand: string;
  transactionAmount: number;
  currency: string;
  merchantName: string;
  location: string;
  transactionTime: string;
  transactionCategory: string;
  transactionSource: string;
  securityQuestion: string;
  status: keyof typeof STATUS_STYLES;
  outcomeNote: string | null;
}

interface FraudCasePanelProps {
  className?: string;
}

export function FraudCasePanel({ className }: FraudCasePanelProps) {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const fetchCases = async () => {
      try {
        const response = await fetch('/api/fraud-cases', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load fraud cases');
        }
        const payload: { cases?: FraudCase[] } = await response.json();
        if (isMounted) {
          setCases(payload.cases ?? []);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    fetchCases();
    timer = setInterval(fetchCases, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  const headerText = useMemo(() => {
    if (error) return 'Database unavailable';
    if (isLoading) return 'Loading…';
    return 'Fraud Alert Queue';
  }, [error, isLoading]);

  const caseCount = cases.filter((c) => c.status === 'pending_review').length;

  return (
    <section
      className={cn(
        'bg-background/95 border-primary/20 text-sm backdrop-blur-xl',
        'border rounded-2xl shadow-xl transition-colors duration-200',
        'overflow-hidden',
        className
      )}
    >
      {/* Header with BoB branding */}
      <header className="border-b border-primary/10 bg-linear-to-r from-[#F15A24]/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/bob-logo.png"
              alt="Bank of Baroda"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-foreground font-semibold truncate">{headerText}</h2>
              {!error && !isLoading && caseCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-[#F15A24] px-2 py-0.5 text-[10px] font-bold text-white">
                  {caseCount}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-[11px]">Bank of Baroda · Fraud Protection</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-3 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive" role="status">
            <Warning weight="fill" className="h-4 w-4 shrink-0" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {!error && (
          <ul className="flex flex-col gap-2">
            {cases.map((fraudCase) => {
              const date = new Date(fraudCase.transactionTime);
              const formattedTime = Number.isNaN(date.getTime())
                ? fraudCase.transactionTime
                : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
              const StatusIcon = STATUS_ICONS[fraudCase.status] ?? Clock;

              return (
                <li
                  key={fraudCase.id}
                  className={cn(
                    'rounded-xl border p-3 transition-all hover:shadow-md',
                    'bg-card/50 border-border/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium text-sm truncate">
                        {fraudCase.customerName}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {fraudCase.cardEnding} · {fraudCase.cardBrand}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0',
                        STATUS_STYLES[fraudCase.status] ?? STATUS_STYLES.pending_review
                      )}
                    >
                      <StatusIcon weight="bold" className="h-3 w-3" />
                      {STATUS_COPY[fraudCase.status] ?? fraudCase.status}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-foreground text-xs font-medium">
                      <span className="text-[#F15A24] font-semibold">{fraudCase.currency} {fraudCase.transactionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      {' '}at {fraudCase.merchantName}
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      {fraudCase.location} · {formattedTime}
                    </p>
                  </div>

                  {fraudCase.outcomeNote && (
                    <p className="text-muted-foreground text-[11px] mt-2 italic line-clamp-2">
                      &quot;{fraudCase.outcomeNote}&quot;
                    </p>
                  )}
                </li>
              );
            })}
            {!isLoading && cases.length === 0 && (
              <li className="text-muted-foreground text-center py-6 text-sm">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500" weight="duotone" />
                No pending fraud alerts
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
