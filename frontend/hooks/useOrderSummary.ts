import { useEffect, useState } from 'react';

export interface OrderSummary {
  drinkType: string;
  size: string;
  milk: string;
  extras: string[];
  name: string;
  summary: string;
  fileName: string;
  completedAt?: string;
  updatedAt: string;
}

interface LatestOrderResponse {
  fileName: string;
  updatedAt: string;
  completedAt?: string;
  summary: string;
  order: {
    drinkType: string;
    size: string;
    milk: string;
    extras: string[];
    name: string;
  };
}

export function useOrderSummary(active: boolean, pollMs = 4000) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      setOrder(null);
      return;
    }

    let cancelled = false;
    const fetchLatest = async () => {
      try {
        const response = await fetch('/api/orders/latest', { cache: 'no-store' });
        if (response.status === 204) {
          if (!cancelled) {
            setOrder(null);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const payload = (await response.json()) as LatestOrderResponse;
        if (!cancelled) {
          setOrder({
            ...payload.order,
            summary: payload.summary,
            fileName: payload.fileName,
            completedAt: payload.completedAt,
            updatedAt: payload.updatedAt,
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    };

    fetchLatest();
    const handle = setInterval(fetchLatest, pollMs);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [active, pollMs]);

  return { order, error };
}
