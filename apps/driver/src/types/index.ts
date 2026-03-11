// ── Driver App Core Types ─────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "PROCESSING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "COLLECTED" | "SETTLED";
export type PaymentMethod = "CASH" | "UPI";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DriverUser {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: "DRIVER";
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string | null;
  isAvailable: boolean;
  totalDeliveries: number;
}

export interface Customer {
  id: string;
  name: string | null;
  phone: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  service: { id: string; name: string };
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  serviceItem: ServiceItem;
}

export interface Order {
  id: string;
  userId: string;
  driverId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes: string | null;
  user: Customer;
  driver: Driver | null;
  address: Address | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
