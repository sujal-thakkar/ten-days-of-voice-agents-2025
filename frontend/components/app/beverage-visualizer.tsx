'use client';

import { memo } from 'react';
import type { OrderSummary } from '@/hooks/useOrderSummary';
import { cn } from '@/lib/utils';

const SIZE_HEIGHT: Record<string, number> = {
  small: 140,
  medium: 170,
  grande: 190,
  large: 210,
};

function normalizeKey(value: string | undefined) {
  return value?.toLowerCase().trim() ?? '';
}

function cupHeight(size: string) {
  const key = normalizeKey(size);
  return SIZE_HEIGHT[key] ?? 170;
}

function beverageColor(drinkType: string, milk: string) {
  const drink = normalizeKey(drinkType);
  const dairy = normalizeKey(milk);
  if (drink.includes('matcha')) {
    return '#9bcc6f';
  }
  if (drink.includes('mocha') || drink.includes('chocolate')) {
    return '#5D4037';
  }
  if (drink.includes('cold brew') || drink.includes('black')) {
    return '#3E2723';
  }
  if (drink.includes('latte') || drink.includes('cappuccino') || drink.includes('flat white')) {
    return '#A1887F';
  }
  if (drink.includes('espresso')) {
    return '#3E2723';
  }
  if (drink.includes('tea')) {
    return '#D7CCC8';
  }
  if (dairy.includes('oat') || dairy.includes('almond')) {
    return '#D7CCC8';
  }
  return '#8D6E63'; // Default coffee color
}

function hasWhip(extras: string[]) {
  return extras.some((extra) => extra.toLowerCase().includes('whip') || extra.toLowerCase().includes('cream'));
}

function hasDrizzle(extras: string[]) {
  return extras.some((extra) => extra.toLowerCase().includes('caramel') || extra.toLowerCase().includes('drizzle') || extra.toLowerCase().includes('sauce'));
}

interface BeverageVisualizerProps {
  order: OrderSummary;
  className?: string;
}

export const BeverageVisualizer = memo(({ order, className }: BeverageVisualizerProps) => {
  const extras = order.extras ?? [];
  const height = cupHeight(order.size);
  const drinkColor = beverageColor(order.drinkType, order.milk);
  const showWhip = hasWhip(extras);
  const showDrizzle = hasDrizzle(extras);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="text-xs font-medium uppercase tracking-widest text-primary/80">Blue Tokai Brew</div>
      <div
        className="relative w-32 transition-all duration-500 ease-in-out"
        style={{ height }}
      >
        {/* Cup Body */}
        <div className="absolute inset-0 overflow-hidden rounded-b-[2rem] border-2 border-primary/10 bg-white shadow-xl backdrop-blur-sm">
           {/* Liquid */}
          <div
            className="absolute inset-x-0 bottom-0 transition-all duration-500"
            style={{
              top: showWhip ? '25%' : '15%',
              backgroundColor: drinkColor,
              opacity: 0.9,
            }}
          >
             {/* Ice cubes if cold */}
             {(order.drinkType?.toLowerCase().includes('iced') || order.drinkType?.toLowerCase().includes('cold')) && (
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute left-4 top-8 h-6 w-6 rotate-12 rounded bg-white/40" />
                  <div className="absolute right-6 top-12 h-5 w-5 -rotate-6 rounded bg-white/40" />
                  <div className="absolute left-8 bottom-8 h-7 w-7 rotate-45 rounded bg-white/40" />
                </div>
             )}
          </div>
          
          {/* Cup Shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent opacity-50" />
        </div>

        {/* Whipped Cream */}
        {showWhip && (
          <div className="absolute -top-6 left-1/2 w-24 -translate-x-1/2">
             <div className="relative h-12 w-full">
                <div className="absolute bottom-0 left-1/2 h-8 w-20 -translate-x-1/2 rounded-full bg-white shadow-sm" />
                <div className="absolute bottom-3 left-1/2 h-8 w-16 -translate-x-1/2 rounded-full bg-white shadow-sm" />
                <div className="absolute bottom-6 left-1/2 h-6 w-10 -translate-x-1/2 rounded-t-full bg-white shadow-sm" />
             </div>
          </div>
        )}

        {/* Drizzle */}
        {showDrizzle && (
          <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 flex-col gap-1 opacity-80">
             <div className="h-12 w-0.5 bg-[#C27C2E]" />
             <div className="absolute left-2 h-10 w-0.5 rotate-12 bg-[#C27C2E]" />
             <div className="absolute -left-2 h-10 w-0.5 -rotate-12 bg-[#C27C2E]" />
          </div>
        )}

        {/* Logo/Label */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 shadow-sm">
           <div className="h-6 w-6 rounded-full bg-primary/20" /> 
        </div>

        {/* Labels */}
        <div className="absolute -bottom-8 inset-x-0 flex justify-center gap-2 text-[10px] font-medium uppercase text-muted-foreground">
          <span>{order.size || 'Regular'}</span>
          <span>•</span>
          <span>{order.milk || 'Standard'}</span>
        </div>
      </div>
    </div>
  );
});

BeverageVisualizer.displayName = 'BeverageVisualizer';
