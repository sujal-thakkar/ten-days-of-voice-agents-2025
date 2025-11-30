'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from './ProductCard';
import { useProducts, useCart } from '@/hooks/useCommerce';

interface ProductGridProps {
  initialCategory?: string;
  showCategoryFilter?: boolean;
  showSearchFilter?: boolean;
}

const CATEGORIES = [
  { value: '', label: 'All Products', icon: '🛍️' },
  { value: 'Electronics', label: 'Electronics', icon: '📱' },
  { value: 'Clothing', label: 'Clothing', icon: '👕' },
  { value: 'Home & Garden', label: 'Home & Garden', icon: '🏡' },
  { value: 'Sports', label: 'Sports', icon: '⚽' },
];

export function ProductGrid({
  initialCategory = '',
  showCategoryFilter = true,
  showSearchFilter = true,
}: ProductGridProps) {
  const [category, setCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const { products, total, isLoading, error, hasMore, loadMore } = useProducts({
    category: category || undefined,
    search: debouncedSearch || undefined,
    limit: 12,
  });

  const { addItem, isLoading: isCartLoading } = useCart();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddToCart = async (productId: string, quantity: number, size?: string) => {
    await addItem(productId, quantity, size);
    setAddedToCart(productId);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToCart && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/30 font-medium text-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added to cart!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters - Redesigned for dark theme */}
      {(showCategoryFilter || showSearchFilter) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          {/* Search */}
          {showSearchFilter && (
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Category Filter - Pill buttons */}
          {showCategoryFilter && (
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    category === cat.value
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="px-1 mb-3 text-sm text-white/60">
        {isLoading ? (
          <span className="animate-pulse">Loading products...</span>
        ) : (
          `${total} product${total !== 1 ? 's' : ''} found`
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
          Failed to load products: {error.message}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        {products.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  disabled={isCartLoading}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/60">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-lg font-medium text-white">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : null}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-white/10" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-8 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more button */}
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/20"
            >
              Load More Products
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
