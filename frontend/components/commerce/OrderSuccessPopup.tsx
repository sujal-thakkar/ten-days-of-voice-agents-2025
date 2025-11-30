'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '@/lib/commerce-types';
import type { OrderDetail } from '@/lib/commerce-types';

interface OrderSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderId: string;
    total: number;
    currency: string;
    items?: Array<{
      product_name: string;
      quantity: number;
      size?: string;
      item_total: number;
    }>;
    itemCount?: number;
  } | null;
}

export function OrderSuccessPopup({ isOpen, onClose, order }: OrderSuccessPopupProps) {
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowCheckmark(false);
      setShowDetails(false);
      // Stagger the animations
      const timer1 = setTimeout(() => setShowCheckmark(true), 300);
      const timer2 = setTimeout(() => setShowDetails(true), 800);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-200"
            onClick={onClose}
          />

          {/* Popup Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-201 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-linear-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl overflow-hidden">
              {/* Success Header with Animation */}
              <div className="relative pt-10 pb-6 px-6 bg-linear-to-br from-green-500 to-emerald-600">
                {/* Confetti Effect */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 0 }}
                      animate={{ 
                        y: 300, 
                        x: Math.random() * 400 - 200, 
                        opacity: [0, 1, 1, 0],
                        rotate: Math.random() * 360 
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2, 
                        delay: Math.random() * 0.5,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2
                      }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'][i % 5],
                      }}
                    />
                  ))}
                </div>

                {/* Checkmark Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: showCheckmark ? 1 : 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                  className="relative mx-auto w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                  {/* Animated Checkmark SVG */}
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: showCheckmark ? 1 : 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      d="M5 13l4 4L19 7"
                      stroke="#22C55E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  
                  {/* Pulse Ring */}
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-white"
                  />
                </motion.div>

                {/* Success Text */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: showCheckmark ? 1 : 0, y: showCheckmark ? 0 : 10 }}
                  transition={{ delay: 0.7 }}
                  className="mt-4 text-center"
                >
                  <h2 className="text-2xl font-bold text-white">Order Successful!</h2>
                  <p className="text-green-100 text-sm mt-1">Your order has been placed</p>
                </motion.div>
              </div>

              {/* Order Details */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showDetails ? 1 : 0 }}
                className="p-6"
              >
                {/* Order ID with Copy */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order ID</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigator.clipboard.writeText(order.orderId)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Copy
                    </motion.button>
                  </div>
                  <p className="text-lg font-mono font-bold text-gray-900 dark:text-white mt-1">
                    {order.orderId}
                  </p>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Order Items
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity}
                              {item.size && ` • Size: ${item.size}`}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPrice(item.item_total, order.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Amount - Large Display */}
                <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Paid</span>
                    <motion.span
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ delay: 1.2, duration: 0.3 }}
                      className="text-2xl font-bold text-green-600 dark:text-green-400"
                    >
                      {formatPrice(order.total, order.currency)}
                    </motion.span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-linear-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transition-shadow"
                  >
                    Continue Shopping
                  </motion.button>
                </div>

                {/* Footer Note */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                  Thank you for shopping with us! 🎉
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
