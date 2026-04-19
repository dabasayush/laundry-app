import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Order } from '@laundry/shared-types'
import API_CLIENT from '@/lib/apiClient'

interface DriverOrdersState {
  availableOrders: Order[]
  acceptedOrders: Order[]
  completedOrders: Order[]
  currentOrder: Order | null
  loading: boolean
  error: string | null
}

const initialState: DriverOrdersState = {
  availableOrders: [],
  acceptedOrders: [],
  completedOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
}

export const fetchAvailableOrders = createAsyncThunk(
  'driverOrders/fetchAvailableOrders',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API_CLIENT.get('/driver-app/available-orders')
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch available orders')
    }
  }
)

export const fetchMyOrders = createAsyncThunk(
  'driverOrders/fetchMyOrders',
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const { data } = await API_CLIENT.get('/driver-app/my-orders', {
        params: { status },
      })
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders')
    }
  }
)

export const acceptOrder = createAsyncThunk(
  'driverOrders/acceptOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const { data } = await API_CLIENT.post(`/driver-app/orders/${orderId}/accept`, {})
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept order')
    }
  }
)

export const rejectOrder = createAsyncThunk(
  'driverOrders/rejectOrder',
  async (
    { orderId, reason }: { orderId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await API_CLIENT.post(`/driver-app/orders/${orderId}/reject`, { reason })
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject order')
    }
  }
)

export const updateOrderStatus = createAsyncThunk(
  'driverOrders/updateOrderStatus',
  async (
    { orderId, status }: { orderId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await API_CLIENT.patch(`/driver-app/orders/${orderId}/status`, { status })
      return data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status')
    }
  }
)

const driverOrdersSlice = createSlice({
  name: 'driverOrders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAvailableOrders.fulfilled, (state, action) => {
        state.loading = false
        state.availableOrders = action.payload
      })
      .addCase(fetchAvailableOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.acceptedOrders = action.payload.filter(
          (o: Order) => !['DELIVERED', 'CANCELLED'].includes(o.status)
        )
        state.completedOrders = action.payload.filter(
          (o: Order) => ['DELIVERED', 'CANCELLED'].includes(o.status)
        )
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        state.availableOrders = state.availableOrders.filter((o) => o.id !== action.payload.id)
        state.acceptedOrders.unshift(action.payload)
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload
        }
        const index = state.acceptedOrders.findIndex((o) => o.id === action.payload.id)
        if (index !== -1) {
          state.acceptedOrders[index] = action.payload
        }
      })
  },
})

export const { clearError, setCurrentOrder } = driverOrdersSlice.actions
export default driverOrdersSlice.reducer
