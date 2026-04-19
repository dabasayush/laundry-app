import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Driver } from '@laundry/shared-types'

interface AuthState {
  driver: (Driver & { role?: string }) | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  driver: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  isAuthenticated: false,
}

export const restoreAuth = createAsyncThunk(
  'auth/restoreAuth',
  async (_, { rejectWithValue }) => {
    try {
      const [driver, accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('driver'),
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken'),
      ])

      return {
        driver: driver ? JSON.parse(driver) : null,
        accessToken,
        refreshToken,
      }
    } catch (error) {
      return rejectWithValue('Failed to restore auth')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setDriver: (state, action) => {
      state.driver = action.payload
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.driver = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      AsyncStorage.removeItem('driver')
      AsyncStorage.removeItem('accessToken')
      AsyncStorage.removeItem('refreshToken')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.loading = false
        state.driver = action.payload.driver
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = Boolean(action.payload.accessToken)
      })
      .addCase(restoreAuth.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setDriver, setTokens, logout, clearError } = authSlice.actions
export default authSlice.reducer
