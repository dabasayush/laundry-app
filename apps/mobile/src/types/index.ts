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
export type PickupOption = "MORNING" | "EVENING" | "INSTANT";

export interface User {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  locationLat?: number;
  locationLng?: number;
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
  pickupOption?: PickupOption;
  pickupSurcharge?: number;
  user?: User;
  driver?: Driver;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  id: string;
  code: PickupOption;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  surcharge: number;
  type: "PICKUP";
  available: boolean;
}

export interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
