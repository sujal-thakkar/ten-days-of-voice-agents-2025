/**
 * React hooks for commerce operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  Product, 
  Cart, 
  CheckoutSession, 
  OrderDetail,
  CartUpdateMessage,
  OrderCreatedMessage,
} from '@/lib/commerce-types';
import * as api from '@/lib/commerce-api';

// ============================================================================
// useProducts hook
// ============================================================================

export interface UseProductsOptions {
  category?: string;
  search?: string;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseProductsReturn {
  products: Product[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { category, search, limit = 20, autoFetch = true } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchProducts = useCallback(async (reset: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.listProducts({
        category,
        search,
        limit,
        offset: reset ? 0 : offset,
      });
      
      if (reset) {
        setProducts(response.products);
        setOffset(response.products.length);
      } else {
        setProducts(prev => [...prev, ...response.products]);
        setOffset(prev => prev + response.products.length);
      }
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setIsLoading(false);
    }
  }, [category, search, limit, offset]);
  
  useEffect(() => {
    if (autoFetch) {
      fetchProducts(true);
    }
  }, [category, search]); // Refetch when filters change
  
  const refetch = useCallback(() => fetchProducts(true), [fetchProducts]);
  const loadMore = useCallback(() => fetchProducts(false), [fetchProducts]);
  
  return {
    products,
    total,
    isLoading,
    error,
    refetch,
    loadMore,
    hasMore: products.length < total,
  };
}

// ============================================================================
// useCart hook
// ============================================================================

export interface UseCartReturn {
  cart: Cart | null;
  isLoading: boolean;
  error: Error | null;
  addItem: (productId: string, quantity?: number, size?: string) => Promise<void>;
  updateItem: (productId: string, quantity: number, size?: string) => Promise<void>;
  removeItem: (productId: string, size?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getCart();
      setCart(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch cart'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);
  
  const addItem = useCallback(async (productId: string, quantity: number = 1, size?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.addToCart({ product_id: productId, quantity, size });
      await fetchCart(); // Refresh cart
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add item'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCart]);
  
  const updateItem = useCallback(async (productId: string, quantity: number, size?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.updateCartItem(productId, quantity, size);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update item'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCart]);
  
  const removeItem = useCallback(async (productId: string, size?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.removeFromCart(productId, size);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove item'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCart]);
  
  const clearCartItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.clearCart();
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear cart'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCart]);
  
  return {
    cart,
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart: clearCartItems,
    refetch: fetchCart,
  };
}

// ============================================================================
// useCheckout hook
// ============================================================================

export interface UseCheckoutReturn {
  session: CheckoutSession | null;
  isLoading: boolean;
  error: Error | null;
  createSession: () => Promise<CheckoutSession>;
  updateSession: (fulfillmentOptionId?: string) => Promise<void>;
  completeSession: (buyer?: { first_name?: string; email?: string }) => Promise<CheckoutSession>;
  cancelSession: () => Promise<void>;
}

export function useCheckout(): UseCheckoutReturn {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const createSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.createCheckoutSession();
      setSession(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create checkout');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateSession = useCallback(async (fulfillmentOptionId?: string) => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.updateCheckoutSession(session.id, {
        fulfillment_option_id: fulfillmentOptionId,
      });
      setSession(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update checkout'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  const completeSession = useCallback(async (buyer?: { first_name?: string; email?: string }) => {
    if (!session) throw new Error('No checkout session');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.completeCheckout(session.id, buyer);
      setSession(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to complete checkout');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  const cancelSession = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await api.cancelCheckout(session.id);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel checkout'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  return {
    session,
    isLoading,
    error,
    createSession,
    updateSession,
    completeSession,
    cancelSession,
  };
}

// ============================================================================
// useOrders hook
// ============================================================================

export interface UseOrdersReturn {
  orders: OrderDetail[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOrders(limit: number = 20): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.listOrders(limit);
      setOrders(response.orders);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setIsLoading(false);
    }
  }, [limit]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}

// ============================================================================
// useCommerceMessages hook (for LiveKit text streams)
// ============================================================================

export type CommerceMessage = CartUpdateMessage | OrderCreatedMessage;

export function useCommerceMessages(
  onCartUpdate?: (message: CartUpdateMessage) => void,
  onOrderCreated?: (message: OrderCreatedMessage) => void
) {
  const handleMessage = useCallback((data: string) => {
    try {
      const message = JSON.parse(data) as CommerceMessage;
      
      if (message.type === 'cart_update' && onCartUpdate) {
        onCartUpdate(message as CartUpdateMessage);
      } else if (message.type === 'order_created' && onOrderCreated) {
        onOrderCreated(message as OrderCreatedMessage);
      }
    } catch (err) {
      console.error('Failed to parse commerce message:', err);
    }
  }, [onCartUpdate, onOrderCreated]);
  
  return { handleMessage };
}
