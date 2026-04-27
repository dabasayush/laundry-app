import { useEffect, useState, useCallback } from "react";
import {
  getAddresses,
  createAddress,
  getSlotAvailability,
  validatePincode,
  getOffers,
  previewOffer,
  type Address,
  type Slot,
} from "@/services/api/checkout.api";

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch addresses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = useCallback(async (address: Omit<Address, "id">) => {
    try {
      const newAddress = await createAddress(address);
      setAddresses((prev) => [...prev, newAddress]);
      return newAddress;
    } catch (err: any) {
      setError(err.message || "Failed to create address");
      throw err;
    }
  }, []);

  return { addresses, isLoading, error, refetch: fetchAddresses, addAddress };
}

export function useSlots(date: string | null) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSlotAvailability(date);
        setSlots(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch slots");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [date]);

  return { slots, isLoading, error };
}

export function usePinCodeValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (pincode: string) => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await validatePincode(pincode);
      return result.valid;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to validate pincode";
      setError(errorMsg);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return { validate, isValidating, error };
}

export function useOffers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOffers();
        setOffers(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch offers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const preview = useCallback(async (offerId: string, total: number) => {
    try {
      const result = await previewOffer(offerId, total);
      return result;
    } catch (err: any) {
      console.error("Failed to preview offer:", err);
      throw err;
    }
  }, []);

  return { offers, isLoading, error, preview };
}
