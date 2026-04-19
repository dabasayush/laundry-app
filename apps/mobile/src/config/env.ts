export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
export const AUTH_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') + '/auth' || 'http://localhost:4000/auth'
export const NODE_ENV = process.env.NODE_ENV || 'development'
import Constants from "expo-constants";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra || {};

// Platform-specific API URL defaults for simulators
const DEFAULT_API_URL_IOS = "http://localhost:4000";
const DEFAULT_API_URL_ANDROID = "http://10.0.2.2:4000";
const selectedApiUrl = Platform.OS === "ios" ? DEFAULT_API_URL_IOS : DEFAULT_API_URL_ANDROID;

export const env = {
  // API — Use env variable, extra config, or intelligent platform-specific default
  API_URL: (extra.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL ||
    selectedApiUrl) as string,
  
  // Firebase (FCM)
  FIREBASE_PROJECT_ID: (extra.FIREBASE_PROJECT_ID || "") as string,
  FIREBASE_API_KEY: (extra.FIREBASE_API_KEY || "") as string,
  FIREBASE_MESSAGING_SENDER_ID: (extra.FIREBASE_MESSAGING_SENDER_ID || "") as string,
  FIREBASE_APP_ID: (extra.FIREBASE_APP_ID || "") as string,
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY: (extra.STRIPE_PUBLISHABLE_KEY || "") as string,
  
  // App
  APP_ENV: (extra.APP_ENV || "development") as "development" | "staging" | "production",
};
