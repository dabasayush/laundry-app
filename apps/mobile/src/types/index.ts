// ── Core types (replaces @laundry/shared-types) ──────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "PROCESSING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "WALLET";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  imageUrl: string | null;
  items?: ServiceItem[];
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  isActive: boolean;
  serviceId: string;
  service?: Service;
  item?: {
    id: string;
    name: string;
    imageUrl: string | null;
    description: string | null;
  } | null;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  serviceItem: ServiceItem;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string | null;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes: string | null;
  user?: User;
  driver?: Driver;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface CartItem {
  serviceItem: ServiceItem;
  quantity: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
