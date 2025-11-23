'use client';

import { useMemo, useState } from 'react';
import { BeverageVisualizer } from '@/components/app/beverage-visualizer';
import { useOrderSummary } from '@/hooks/useOrderSummary';
import { cn } from '@/lib/utils';
import { Receipt, Coffee } from '@phosphor-icons/react';

interface OrderPanelProps {
  active: boolean;
  className?: string;
}

function formatTimestamp(iso?: string) {
  if (!iso) return 'just now';
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function OrderPanel({ active, className }: OrderPanelProps) {
  const { order, error } = useOrderSummary(active);
  const [viewMode, setViewMode] = useState<'visual' | 'receipt'>('visual');

  const extrasText = useMemo(() => {
    if (!order) return '—';
    if (!order.extras || order.extras.length === 0) {
      return 'No extras';
    }
    return order.extras.join(', ');
  }, [order]);

  if (!order && !error) {
    return null;
  }

  return (
    <aside
      className={cn(
        'pointer-events-auto flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/95 p-6 text-sm shadow-2xl backdrop-blur-lg transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Blue Tokai</p>
          <p className="text-lg font-serif font-medium text-foreground">Current Order</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setViewMode('visual')}
             className={cn("p-2 rounded-md transition-colors", viewMode === 'visual' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
           >
             <Coffee size={16} />
           </button>
           <button 
             onClick={() => setViewMode('receipt')}
             className={cn("p-2 rounded-md transition-colors", viewMode === 'receipt' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
           >
             <Receipt size={16} />
           </button>
        </div>
      </div>

      {error && <p className="mt-2 text-destructive text-xs">{error}</p>}

      {order && (
        <div className="relative min-h-[200px]">
          {viewMode === 'visual' ? (
            <div className="animate-in fade-in zoom-in duration-300">
              <BeverageVisualizer order={order} className="py-4" />
              <div className="mt-4 text-center">
                <p className="font-serif text-xl text-foreground">{order.name || 'Guest'}</p>
                <p className="text-xs text-muted-foreground">{formatTimestamp(order.updatedAt)}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 font-mono text-xs">
               <div className="flex justify-between border-b border-dashed border-border pb-2">
                  <span>ITEM</span>
                  <span>QTY</span>
               </div>
               <div className="flex justify-between">
                  <span className="font-bold text-base">{order.drinkType || 'Pending...'}</span>
                  <span>1</span>
               </div>
               <div className="pl-4 space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                     <span>Size</span>
                     <span>{order.size || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>Milk</span>
                     <span>{order.milk || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>Extras</span>
                     <span className="max-w-[120px] text-right">{extrasText}</span>
                  </div>
               </div>
               <div className="border-t border-dashed border-border pt-2 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                     <span>CUSTOMER</span>
                     <span>{order.name || 'Guest'}</span>
                  </div>
                  <div className="text-center mt-4 text-[10px] text-muted-foreground uppercase tracking-widest">
                     Thank you for visiting<br/>Blue Tokai Coffee Roasters
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
