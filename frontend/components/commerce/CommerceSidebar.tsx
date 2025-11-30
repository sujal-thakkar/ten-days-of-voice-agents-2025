'use client';

import React, { useState } from 'react';
import { ProductGrid } from './ProductGrid';
import { CartButton } from './CartButton';
import { cn } from '@/lib/utils';

interface CommerceSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function CommerceSidebar({ isOpen, onToggle }: CommerceSidebarProps) {
  return (
    <>
      {/* Sidebar - positioned to not overlap with visualizer */}
      <div
        className={cn(
          'fixed top-12 bottom-0 right-0 w-full max-w-md lg:max-w-[28rem]',
          'bg-background border-l border-border shadow-xl',
          'z-30 transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <span>🛍️</span>
            <span>Shop Products</span>
          </h2>
          <div className="flex items-center gap-2">
            <CartButton />
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="h-[calc(100%-57px)] overflow-y-auto">
          <div className="p-4">
            <ProductGrid showCategoryFilter showSearchFilter />
          </div>
        </div>
      </div>

      {/* Backdrop when sidebar is open - only on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
}

// Floating commerce panel for split-screen view
export function CommercePanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={cn(
        'bg-card rounded-xl shadow-lg overflow-hidden transition-all duration-300',
        isExpanded ? 'w-full' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {isExpanded && (
          <h3 className="font-semibold text-sm">
            Browse Products
          </h3>
        )}
        <div className="flex items-center gap-2">
          {isExpanded && <CartButton />}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <svg
              className={cn('w-4 h-4 transition-transform', !isExpanded && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 max-h-[60vh] overflow-y-auto">
          <ProductGrid showCategoryFilter={false} showSearchFilter />
        </div>
      )}
    </div>
  );
}
