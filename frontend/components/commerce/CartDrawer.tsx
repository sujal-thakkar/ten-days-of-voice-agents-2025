'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart, useCheckout } from '@/hooks/useCommerce';
import { formatPrice } from '@/lib/commerce-types';
import { OrderSuccessPopup } from './OrderSuccessPopup';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, isLoading, updateItem, removeItem, clearCart } = useCart();
  const { session, createSession, completeSession, isLoading: isCheckoutLoading } = useCheckout();
  
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'complete'>('cart');
  const [buyerInfo, setBuyerInfo] = useState({ first_name: '', email: '' });
  const [orderPopup, setOrderPopup] = useState<{ isOpen: boolean; order: any }>({ isOpen: false, order: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCheckout = async () => {
    try {
      await createSession();
      setCheckoutStep('checkout');
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    }
  };

  const handleCompleteOrder = async () => {
    try {
      const completedSession = await completeSession(buyerInfo);
      if (completedSession.order) {
        // Show the order success popup
        setOrderPopup({
          isOpen: true,
          order: {
            orderId: completedSession.order.order_id,
            total: completedSession.totals.total,
            currency: completedSession.totals.currency || 'INR',
            items: completedSession.line_items.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              size: item.size,
              item_total: item.line_total,
            })),
            itemCount: completedSession.line_items.reduce((sum, item) => sum + item.quantity, 0),
          },
        });
        setCheckoutStep('complete');
      }
    } catch (err) {
      console.error('Failed to complete order:', err);
    }
  };

  const handleNewOrder = () => {
    setCheckoutStep('cart');
    setBuyerInfo({ first_name: '', email: '' });
    setOrderPopup({ isOpen: false, order: null });
  };

  const handleCloseOrderPopup = () => {
    setOrderPopup({ isOpen: false, order: null });
    handleNewOrder();
    onClose();
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartCurrency = cart?.currency ?? 'INR';
  const checkoutCurrency = session?.totals.currency ?? cartCurrency;

  // Don't render on server side
  if (!mounted) return null;

  const drawerContent = (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          style={{ zIndex: 9998 }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 backdrop-blur-xl border-l border-white/10 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-xl">
              {checkoutStep === 'cart' && '🛒'}
              {checkoutStep === 'checkout' && '💳'}
              {checkoutStep === 'complete' && '✅'}
            </span>
            {checkoutStep === 'cart' && `Shopping Cart (${itemCount})`}
            {checkoutStep === 'checkout' && 'Checkout'}
            {checkoutStep === 'complete' && 'Order Confirmed'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ height: 'calc(100vh - 180px)' }}>
          {checkoutStep === 'cart' && (
            <CartContent
              cart={cart}
              isLoading={isLoading}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
            />
          )}

          {checkoutStep === 'checkout' && session && (
            <CheckoutContent
              session={session}
              buyerInfo={buyerInfo}
              onBuyerInfoChange={setBuyerInfo}
            />
          )}

          {checkoutStep === 'complete' && session?.order && (
            <OrderCompleteContent
              orderId={session.order.order_id}
              total={session.totals.total}
              currency={checkoutCurrency}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-white/5">
          {checkoutStep === 'cart' && cart && cart.items.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="font-bold text-white text-lg">
                  {formatPrice(cart.total, cartCurrency)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    clearCart();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 font-medium text-sm transition-all duration-200 cursor-pointer"
                >
                  Clear Cart
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCheckout();
                  }}
                  disabled={isCheckoutLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-lg shadow-purple-500/30 cursor-pointer"
                >
                  {isCheckoutLoading ? 'Processing...' : 'Checkout →'}
                </button>
              </div>
            </div>
          )}

          {checkoutStep === 'checkout' && session && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Total</span>
                <span className="text-xl font-bold text-white">
                  {formatPrice(session.totals.total, checkoutCurrency)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setCheckoutStep('cart');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 font-medium text-sm transition-all duration-200 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCompleteOrder();
                  }}
                  disabled={isCheckoutLoading || !buyerInfo.first_name}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-lg shadow-green-500/30 cursor-pointer"
                >
                  {isCheckoutLoading ? 'Processing...' : '✓ Place Order'}
                </button>
              </div>
            </div>
          )}

          {checkoutStep === 'complete' && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleNewOrder();
              }}
              className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-500/30 cursor-pointer"
            >
              Continue Shopping →
            </button>
          )}
        </div>
      </div>

      {/* Order Success Popup */}
      <OrderSuccessPopup
        isOpen={orderPopup.isOpen}
        onClose={handleCloseOrderPopup}
        order={orderPopup.order}
      />
    </>
  );

  return createPortal(drawerContent, document.body);
}

// Cart Content Sub-component
interface CartContentProps {
  cart: ReturnType<typeof useCart>['cart'];
  isLoading: boolean;
  onUpdateItem: (productId: string, quantity: number, size?: string) => Promise<void>;
  onRemoveItem: (productId: string, size?: string) => Promise<void>;
}

function CartContent({ cart, isLoading, onUpdateItem, onRemoveItem }: CartContentProps) {
  const currency = cart?.currency ?? 'INR';

  if (isLoading && !cart) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/60">
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
          <span className="text-4xl">🛒</span>
        </div>
        <p className="text-lg font-medium text-white">Your cart is empty</p>
        <p className="text-sm">Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cart.items.map((item) => (
        <div
          key={`${item.product_id}-${item.size || 'default'}`}
          className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
        >
          {/* Product image placeholder */}
          <div className="w-14 h-14 rounded-xl bg-linear-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-white/10">
            <span className="text-xl">📦</span>
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">
              {item.product_name}
            </h4>
            {item.size && (
              <span className="inline-block text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full mt-1">Size: {item.size}</span>
            )}
            <p className="text-sm font-bold text-violet-400 mt-1">
              {formatPrice(item.price, item.currency ?? currency)}
            </p>
          </div>

          {/* Quantity controls */}
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveItem(item.product_id, item.size);
              }}
              className="text-white/40 hover:text-red-400 transition-colors p-1 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateItem(item.product_id, Math.max(0, item.quantity - 1), item.size);
                }}
                className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer text-lg font-medium"
              >
                −
              </button>
              <span className="px-4 py-2 text-sm font-bold text-white min-w-10 text-center">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateItem(item.product_id, item.quantity + 1, item.size);
                }}
                className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer text-lg font-medium"
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Checkout Content Sub-component
interface CheckoutContentProps {
  session: ReturnType<typeof useCheckout>['session'];
  buyerInfo: { first_name: string; email: string };
  onBuyerInfoChange: (info: { first_name: string; email: string }) => void;
}

function CheckoutContent({ session, buyerInfo, onBuyerInfoChange }: CheckoutContentProps) {
  if (!session) return null;
  const currency = session.totals.currency ?? 'INR';

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <span>📋</span> Order Summary
        </h3>
        <div className="space-y-2">
          {session.line_items.map((item) => (
            <div key={item.product_id} className="flex justify-between text-sm">
              <span className="text-white/70">
                {item.product_name} × {item.quantity}
              </span>
              <span className="text-white font-medium">
                {formatPrice(item.line_total, currency)}
              </span>
            </div>
          ))}
          <hr className="border-white/10 my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span className="text-white">
              {formatPrice(session.totals.subtotal, currency)}
            </span>
          </div>
          {session.totals.shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Shipping</span>
              <span className="text-white">
                {formatPrice(session.totals.shipping, currency)}
              </span>
            </div>
          )}
          {session.totals.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Tax</span>
              <span className="text-white">
                {formatPrice(session.totals.tax, currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Buyer Information */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <span>👤</span> Your Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={buyerInfo.first_name}
              onChange={(e) => onBuyerInfoChange({ ...buyerInfo, first_name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-white/40 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Email (optional)
            </label>
            <input
              type="email"
              value={buyerInfo.email}
              onChange={(e) => onBuyerInfoChange({ ...buyerInfo, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-white/40 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Payment Note */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm">
        <p className="font-semibold text-amber-400 flex items-center gap-2">
          <span>⚡</span> Demo Mode
        </p>
        <p className="text-amber-400/70 text-xs mt-1">This is a demo checkout. No real payment will be processed.</p>
      </div>
    </div>
  );
}

// Order Complete Sub-component
interface OrderCompleteContentProps {
  orderId: string;
  total: number;
  currency: string;
}

function OrderCompleteContent({ orderId, total, currency }: OrderCompleteContentProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Order Confirmed!
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Thank you for your order.
      </p>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 w-full">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Order ID</span>
          <span className="font-mono text-gray-900 dark:text-white">{orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total</span>
          <span className="font-bold text-gray-900 dark:text-white">{formatPrice(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
