import axios, { type AxiosInstance, type AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { env } from "@/config/env";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host machine
// iOS simulator and physical devices use localhost
const getApiUrl = () => {
  const baseUrl = env.API_URL;
  const apiPath = "/api/v1";
  return `${baseUrl}${apiPath}`;
};

const API_CLIENT: AxiosInstance = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach access token
API_CLIENT.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle token refresh
API_CLIENT.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshUrl = `${env.API_URL}/api/v1/auth/refresh`;
        const response = await axios.post(
          refreshUrl,
          { refreshToken },
          { timeout: 10000 },
        );

        const { accessToken, refreshToken: newRefresh } = response.data.data;
        await AsyncStorage.multiSet([
          ["accessToken", accessToken],
          ["refreshToken", newRefresh],
        ]);

        API_CLIENT.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        return API_CLIENT(originalRequest);
      } catch (_err) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        // Dispatch logout action here from Redux
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default API_CLIENT;
