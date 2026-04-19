export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
export const AUTH_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') + '/auth' || 'http://localhost:4000/auth'
export const NODE_ENV = process.env.NODE_ENV || 'development'
