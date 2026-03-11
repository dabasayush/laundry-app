// ────────────────────────────────────────────────────────────────────────────
// Shared Domain Types — used by API, Mobile, and Admin
// ────────────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "driver" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "picked_up"
  | "processing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  fcm_token?: string | null;
  address?: Address | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  description?: string;
  price_per_kg: number;
  estimated_hours: number;
  is_active: boolean;
  icon_url?: string;
  created_at: string;
  updated_at: string;
}

// ─── Slot ─────────────────────────────────────────────────────────────────────
export interface Slot {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  capacity: number;
  booked_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  customer_id: string;
  service_id: string;
  pickup_slot_id: string;
  delivery_slot_id: string;
  driver_id?: string | null;
  status: OrderStatus;
  weight_kg?: number | null;
  amount?: number | null;
  pickup_address: Address;
  delivery_address: Address;
  special_instructions?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

// ─── Order Status History ─────────────────────────────────────────────────────
export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  type: "charge" | "refund";
  stripe_charge_id?: string;
  status: "pending" | "succeeded" | "failed";
  created_at: string;
  updated_at: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard Analytics ──────────────────────────────────────────────────────
export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  totalCustomers: number;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
}
