/**
 * Types for ACP E-commerce API
 * Based on Agentic Commerce Protocol (ACP) specification
 */

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Minor units (e.g., 49900 = ₹499)
  currency: string;
  category: string;
  color?: string;
  material?: string;
  available_sizes?: string[];
  capacity?: string;
  in_stock: boolean;
  stock_quantity?: number;
  image?: string; // Emoji or image URL
  image_url?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

// Cart types
export interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  size?: string;
  unit_price: number;
  price: number; // total price for this item
  total_price: number;
  currency: string;
  image_url?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  updated_at: string;
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
  size?: string;
}

export interface CartResponse {
  success: boolean;
  message: string;
  cart_id?: string;
  item_count: number;
  total: number;
  currency?: string;
}

// Checkout types
export interface LineItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  size?: string;
  unit_price: number;
  line_total: number;
  item?: { id: string; quantity: number };
  base_amount?: number;
  discount?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
}

export interface Totals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface FulfillmentOption {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  carrier?: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Order {
  order_id: string;
  checkout_session_id?: string;
  permalink_url?: string;
}

export interface CheckoutSession {
  id: string;
  status: 'not_ready_for_payment' | 'ready_for_payment' | 'in_progress' | 'completed' | 'canceled';
  currency: string;
  line_items: LineItem[];
  totals: Totals;
  fulfillment_options: FulfillmentOption[];
  fulfillment_option_id?: string;
  order?: Order;
  created_at: string;
  updated_at: string;
}

// Order types
export interface OrderDetail {
  id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    size?: string;
    unit_price: number;
    item_total: number;
    currency: string;
  }>;
  item_count: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface OrdersResponse {
  orders: OrderDetail[];
  total: number;
}

export interface OrderAnalytics {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  currency: string;
  orders_by_status: Record<string, number>;
  top_products: Array<{ product_id: string; quantity_sold: number }>;
}

// Text stream message types (for LiveKit integration)
export interface CartUpdateMessage {
  type: 'cart_update';
  cart_id: string;
  action: 'add' | 'remove' | 'update' | 'clear';
  product_id?: string;
  item_count: number;
  total: number;
}

export interface OrderCreatedMessage {
  type: 'order_created';
  order_id: string;
  total: number;
  item_count: number;
  status: string;
}

// Error response
export interface ErrorResponse {
  type: string;
  code: string;
  message: string;
  param?: string;
}

// Category mapping
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  mug: 'Coffee Mugs',
  tshirt: 'T-Shirts',
  hoodie: 'Hoodies',
  bottle: 'Water Bottles',
  bag: 'Bags & Backpacks',
};

// Utility function to format price (values are already in rupees from the API)
export function formatPrice(amount: number, currency: string = 'INR'): string {
  const normalizedCurrency = currency?.toUpperCase() || 'INR';
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (normalizedCurrency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizedCurrency,
  }).format(safeAmount);
}
