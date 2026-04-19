import API_CLIENT from '@/lib/apiClient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Driver } from '@laundry/shared-types'

export interface DriverAuthResponse {
  driver: Driver & { role?: string }
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export async function driverLogin(phone: string, password: string): Promise<DriverAuthResponse> {
  const { data } = await API_CLIENT.post('/driver-app/login', { phone, password })
  const response = data.data as DriverAuthResponse

  // Save tokens and driver data
  await Promise.all([
    AsyncStorage.setItem('driver', JSON.stringify(response.driver)),
    AsyncStorage.setItem('accessToken', response.tokens.accessToken),
    AsyncStorage.setItem('refreshToken', response.tokens.refreshToken),
  ])

  return response
}

export async function logout(): Promise<void> {
  try {
    await API_CLIENT.post('/driver-app/logout', {})
  } catch (_error) {
    // Continue with logout even if API call fails
  } finally {
    await AsyncStorage.multiRemove(['driver', 'accessToken', 'refreshToken'])
  }
}

export async function getDriverProfile(): Promise<Driver> {
  const { data } = await API_CLIENT.get('/driver-app/profile')
  return data.data
}

export async function updateLocation(lat: number, lng: number): Promise<void> {
  await API_CLIENT.post('/driver-app/location', { lat, lng })
}
