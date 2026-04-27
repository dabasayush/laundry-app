import { useEffect, useState, useCallback } from "react";
import { useServiceStore } from "@/store/serviceStore";
import {
  getServices,
  getServiceById,
  getServiceItems,
} from "@/services/api/services.api";
import type { Service, ServiceItem } from "@laundry/shared-types";

export function useServices() {
  const { services, isLoading, error, setServices, setLoading, setError } =
    useServiceStore();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  }, [setServices, setLoading, setError]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, isLoading, error, refetch: fetchServices };
}

export function useServiceDetail(serviceId: string | undefined) {
  const [service, setService] = useState<Service | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setIsLoading(false);
      return;
    }

    const fetchServiceDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [serviceData, itemsData] = await Promise.all([
          getServiceById(serviceId),
          getServiceItems(serviceId),
        ]);
        setService(serviceData);
        setItems(itemsData);
      } catch (err: any) {
        setError(err.message || "Failed to fetch service details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetail();
  }, [serviceId]);

  return { service, items, isLoading, error };
}
