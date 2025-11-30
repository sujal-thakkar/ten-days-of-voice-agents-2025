'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { Product } from '@/lib/commerce-types';
import { formatPrice } from '@/lib/commerce-types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, quantity: number, size?: string) => Promise<void>;
  disabled?: boolean;
}

export function ProductCard({ product, onAddToCart, disabled = false }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.available_sizes?.[0]
  );
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await onAddToCart(product.id, quantity, selectedSize);
      // Reset quantity after adding
      setQuantity(1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = !product.in_stock;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all overflow-hidden"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <span className="text-5xl">{product.image || '📦'}</span>
        )}
        
        {/* Category badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-500/80 text-white backdrop-blur-sm">
          {product.category}
        </span>

        {/* Color badge */}
        {product.color && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/20 text-white backdrop-blur-sm capitalize">
            {product.color}
          </span>
        )}
        
        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-lg">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 p-4 flex flex-col">
        <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
          {product.name}
        </h3>
        
        <p className="text-xs text-white/60 line-clamp-2 mb-3 flex-1">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold text-white">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.stock_quantity !== undefined && product.stock_quantity > 0 && (
            <span className="text-xs text-white/50">
              {product.stock_quantity} left
            </span>
          )}
        </div>

        {/* Size selector (if applicable) */}
        {product.available_sizes && product.available_sizes.length > 0 && (
          <div className="mb-3">
            <label className="text-xs text-white/50 mb-1.5 block">
              Size
            </label>
            <div className="flex flex-wrap gap-1.5">
              {product.available_sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    selectedSize === size
                      ? 'border-purple-500 bg-purple-500/30 text-purple-200'
                      : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                  }`}
                  disabled={disabled || isOutOfStock}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity selector */}
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs text-white/50">Qty:</label>
          <div className="flex items-center border border-white/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
              disabled={quantity <= 1 || disabled || isOutOfStock}
            >
              -
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-white min-w-8 text-center bg-white/5">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(product.stock_quantity || 10, quantity + 1))}
              className="px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
              disabled={quantity >= (product.stock_quantity || 10) || disabled || isOutOfStock}
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={disabled || isAdding || isOutOfStock}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
            isOutOfStock
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : isAdding
              ? 'bg-purple-500/50 text-white cursor-wait'
              : 'bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30'
          }`}
        >
          {isAdding ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Adding...
            </span>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            `Add to Cart – ${formatPrice(product.price * quantity, product.currency)}`
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
