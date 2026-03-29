// ── Enums ───────────────────────────────────────────────────────────────────

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
export type UserRole = "CUSTOMER" | "DRIVER" | "ADMIN";
export type DiscountType = "PERCENTAGE" | "FLAT";
export type BroadcastTarget =
  | "ALL"
  | "CUSTOMER"
  | "DRIVER"
  | "SELECTED"
  | "INACTIVE";

// ── API wrapper types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Domain models ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  isActive: boolean;
  serviceId: string;
  itemId?: string | null;
  service?: { id: string; name: string };
  item?: Item | null;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  serviceItems?: Array<{
    id: string;
    serviceId: string;
    price: number;
    isActive: boolean;
    service: { id: string; name: string };
  }>;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ServiceItem[];
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
  addressId: string | null;
  offerId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name" | "phone">;
  driver: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string | null;
  } | null;
  address: Address | null;
  items: OrderItem[];
}

export interface Offer {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  applicableServiceId: string | null;
  applicableItemId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  target: BroadcastTarget;
  sentAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Analytics types ──────────────────────────────────────────────────────────

export interface TodaySnapshot {
  date: string;
  ordersToday: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  driverCashPending: {
    orderCount: number;
    totalAmount: number;
  };
}

export interface RevenueReport {
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface DriverCashRow {
  driverId: string;
  driverName: string;
  phone: string;
  orderCount: number;
  totalPending: number;
}

export interface DriverCashReport {
  summary: {
    totalDrivers: number;
    totalOrders: number;
    totalPending: number;
  };
  drivers: DriverCashRow[];
}

export interface OrderTrendPoint {
  date: string;
  count: number;
}

// ── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
