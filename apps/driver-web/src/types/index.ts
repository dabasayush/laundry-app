export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  isAvailable: boolean;
  totalDeliveries: number;
  totalRating: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  serviceItem: {
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  address?: {
    id: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  totalAmount: number;
  finalAmount: number;
  discountAmount: number;
  status: "PENDING" | "PICKUP_ASSIGNED" | "PICKED_UP" | "PROCESSING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  paymentMethod: "CASH" | "UPI";
  paymentStatus: "PENDING" | "COLLECTED" | "SETTLED";
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  driver: Driver;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
