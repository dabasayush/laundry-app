import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  phone: z
    .string({ required_error: "Phone is required" })
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number format")
    .max(20),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: "Email or phone is required" })
    .trim()
    .min(1, "Email or phone is required"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token is required" })
    .min(1, "Refresh token is required"),
});

export const sendOtpSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number format"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number format"),
  otp: z
    .string({ required_error: "OTP is required" })
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
