/**
 * Commerce API Client
 * Client for interacting with the ACP E-commerce API
 */

import type {
  Product,
  ProductListResponse,
  Cart,
  CartResponse,
  AddToCartRequest,
  CheckoutSession,
  OrdersResponse,
  OrderDetail,
  OrderAnalytics,
} from './commerce-types';

// API base URL - should be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_COMMERCE_API_URL || 'http://localhost:8081';

// Session ID management
let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('commerce_session_id');
    }
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('commerce_session_id', sessionId);
      }
    }
  }
  return sessionId;
}

export function setSessionId(id: string): void {
  sessionId = id;
  if (typeof window !== 'undefined') {
    localStorage.setItem('commerce_session_id', id);
  }
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Session-ID': getSessionId(),
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json();
}

// ============================================================================
// Catalog API
// ============================================================================

export interface ListProductsParams {
  category?: string;
  max_price?: number;
  min_price?: number;
  color?: string;
  size?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listProducts(params: ListProductsParams = {}): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.category) searchParams.set('category', params.category);
  if (params.max_price) searchParams.set('max_price', params.max_price.toString());
  if (params.min_price) searchParams.set('min_price', params.min_price.toString());
  if (params.color) searchParams.set('color', params.color);
  if (params.size) searchParams.set('size', params.size);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  
  const queryString = searchParams.toString();
  const endpoint = `/acp/catalog${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<ProductListResponse>(endpoint);
}

export async function getProduct(productId: string): Promise<Product> {
  return apiRequest<Product>(`/acp/catalog/${productId}`);
}

export async function getCategories(): Promise<{ categories: string[]; display_names: Record<string, string> }> {
  return apiRequest(`/acp/catalog/categories`);
}

// ============================================================================
// Cart API
// ============================================================================

export async function getCart(): Promise<Cart> {
  return apiRequest<Cart>('/acp/cart');
}

export async function addToCart(request: AddToCartRequest): Promise<CartResponse> {
  return apiRequest<CartResponse>('/acp/cart/items', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateCartItem(
  productId: string,
  quantity: number,
  size?: string
): Promise<CartResponse> {
  const queryParams = size ? `?size=${encodeURIComponent(size)}` : '';
  return apiRequest<CartResponse>(`/acp/cart/items/${productId}${queryParams}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCart(productId: string, size?: string): Promise<CartResponse> {
  const queryParams = size ? `?size=${encodeURIComponent(size)}` : '';
  return apiRequest<CartResponse>(`/acp/cart/items/${productId}${queryParams}`, {
    method: 'DELETE',
  });
}

export async function clearCart(): Promise<CartResponse> {
  return apiRequest<CartResponse>('/acp/cart', {
    method: 'DELETE',
  });
}

// ============================================================================
// Checkout API
// ============================================================================

export async function createCheckoutSession(): Promise<CheckoutSession> {
  return apiRequest<CheckoutSession>('/acp/checkout_sessions', {
    method: 'POST',
  });
}

export async function getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
  return apiRequest<CheckoutSession>(`/acp/checkout_sessions/${sessionId}`);
}

export async function updateCheckoutSession(
  checkoutSessionId: string,
  updates: {
    fulfillment_option_id?: string;
    fulfillment_address?: {
      name: string;
      line_one: string;
      line_two?: string;
      city: string;
      state: string;
      country: string;
      postal_code: string;
    };
  }
): Promise<CheckoutSession> {
  return apiRequest<CheckoutSession>(`/acp/checkout_sessions/${checkoutSessionId}`, {
    method: 'POST',
    body: JSON.stringify(updates),
  });
}

export async function completeCheckout(
  checkoutSessionId: string,
  buyer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
  }
): Promise<CheckoutSession> {
  return apiRequest<CheckoutSession>(`/acp/checkout_sessions/${checkoutSessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ buyer }),
  });
}

export async function cancelCheckout(checkoutSessionId: string): Promise<CheckoutSession> {
  return apiRequest<CheckoutSession>(`/acp/checkout_sessions/${checkoutSessionId}/cancel`, {
    method: 'POST',
  });
}

// ============================================================================
// Orders API
// ============================================================================

export async function listOrders(limit: number = 20, status?: string): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  params.set('limit', limit.toString());
  if (status) params.set('status', status);
  
  return apiRequest<OrdersResponse>(`/acp/orders?${params.toString()}`);
}

export async function getOrder(orderId: string): Promise<OrderDetail> {
  return apiRequest<OrderDetail>(`/acp/orders/${orderId}`);
}

export async function getOrderAnalytics(
  startDate?: string,
  endDate?: string
): Promise<OrderAnalytics> {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  
  const queryString = params.toString();
  return apiRequest<OrderAnalytics>(
    `/acp/orders/analytics/summary${queryString ? `?${queryString}` : ''}`
  );
}

// ============================================================================
// Health Check
// ============================================================================

export async function healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
  return apiRequest('/acp/health');
}

export async function getApiInfo(): Promise<{
  name: string;
  version: string;
  protocol: string;
  capabilities: Record<string, boolean>;
}> {
  return apiRequest('/acp/info');
}
