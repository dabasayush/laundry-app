import API_CLIENT from "@/lib/apiClient";
import type { Service } from "@laundry/shared-types";

export interface ServiceResponse {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    service: Service;
  }>;
}

export async function getServices(): Promise<Service[]> {
  try {
    const { data } = await API_CLIENT.get("/services", {
      params: { isActive: true },
    });
    return data.data || [];
  } catch (error) {
    console.error("[getServices] Error:", error);
    throw error;
  }
}

export async function getServiceById(id: string): Promise<Service> {
  try {
    const { data } = await API_CLIENT.get(`/services/${id}`);
    return data.data;
  } catch (error) {
    console.error("[getServiceById] Error:", error);
    throw error;
  }
}

export async function getServiceItems(serviceId: string) {
  try {
    const { data } = await API_CLIENT.get("/service-items", {
      params: { serviceId, isActive: true },
    });
    return data.data || [];
  } catch (error) {
    console.error("[getServiceItems] Error:", error);
    throw error;
  }
}
