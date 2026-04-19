import API_CLIENT from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@laundry/shared-types";

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export async function sendOtp(phone: string): Promise<void> {
  const { data } = await API_CLIENT.post("/auth/send-otp", { phone });
  return data.data;
}

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<AuthResponse> {
  const { data } = await API_CLIENT.post("/auth/verify-otp", { phone, otp });
  const response = data.data as AuthResponse;

  // Save tokens and user data
  await Promise.all([
    AsyncStorage.setItem("user", JSON.stringify(response.user)),
    AsyncStorage.setItem("accessToken", response.tokens.accessToken),
    AsyncStorage.setItem("refreshToken", response.tokens.refreshToken),
  ]);

  return response;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const { data } = await API_CLIENT.get("/users/by-phone", {
      params: { mobile: phone },
    });
    return data.data || null;
  } catch (error) {
    console.log("[getUserByPhone] User not found or error:", error);
    return null;
  }
}

export async function createProfile(profileData: {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}): Promise<{ user: User; address: any }> {
  // Update user profile
  const userResponse = await API_CLIENT.patch("/users/me", {
    name: profileData.name,
  });
  const user = userResponse.data.data as User;

  // Create address
  const addressResponse = await API_CLIENT.post("/addresses", {
    label: "Home",
    line1: profileData.line1,
    line2: profileData.line2 || "",
    city: profileData.city,
    state: profileData.state,
    pincode: profileData.pincode,
    isDefault: true,
  });

  // Save updated user data
  await AsyncStorage.setItem("user", JSON.stringify(user));

  return { user, address: addressResponse.data.data };
}

export async function updateProfile(profileData: {
  name?: string;
  email?: string;
}): Promise<User> {
  const { data } = await API_CLIENT.patch("/users/me", profileData);
  const user = data.data as User;

  await AsyncStorage.setItem("user", JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  try {
    await API_CLIENT.post("/auth/logout", {});
  } catch (_error) {
    // Continue with logout even if API call fails
  } finally {
    await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
  }
}

export async function getProfile(): Promise<User> {
  const { data } = await API_CLIENT.get("/users/me");
  return data.data;
}
