import API_CLIENT from "@/lib/apiClient";

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Slot {
  id: string;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  surcharge: number;
  available: boolean;
}

export async function getAddresses(): Promise<Address[]> {
  try {
    const { data } = await API_CLIENT.get("/addresses");
    return data.data || [];
  } catch (error) {
    console.error("[getAddresses] Error:", error);
    throw error;
  }
}

export async function createAddress(
  address: Omit<Address, "id">,
): Promise<Address> {
  try {
    const { data } = await API_CLIENT.post("/addresses", address);
    return data.data;
  } catch (error) {
    console.error("[createAddress] Error:", error);
    throw error;
  }
}

export async function getSlotAvailability(date: string): Promise<Slot[]> {
  try {
    const { data } = await API_CLIENT.get("/slots", {
      params: { date },
    });
    return data.data || [];
  } catch (error) {
    console.error("[getSlotAvailability] Error:", error);
    throw error;
  }
}

export async function validatePincode(
  pincode: string,
): Promise<{ valid: boolean }> {
  try {
    const { data } = await API_CLIENT.get("/addresses/validate-pincode", {
      params: { pincode },
    });
    return data.data;
  } catch (error) {
    console.error("[validatePincode] Error:", error);
    throw error;
  }
}

export async function getOffers() {
  try {
    const { data } = await API_CLIENT.get("/offers");
    return data.data || [];
  } catch (error) {
    console.error("[getOffers] Error:", error);
    throw error;
  }
}

export async function previewOffer(offerId: string, total: number) {
  try {
    const { data } = await API_CLIENT.post("/offers/preview", {
      offerId,
      total,
    });
    return data.data;
  } catch (error) {
    console.error("[previewOffer] Error:", error);
    throw error;
  }
}
