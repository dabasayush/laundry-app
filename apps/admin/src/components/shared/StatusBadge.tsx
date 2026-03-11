import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning"
      | "info"
      | "purple";
  }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  PICKUP_ASSIGNED: { label: "Pickup Assigned", variant: "info" },
  PICKED_UP: { label: "Picked Up", variant: "info" },
  PROCESSING: { label: "Processing", variant: "purple" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "secondary" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
