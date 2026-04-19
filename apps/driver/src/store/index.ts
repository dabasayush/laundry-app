import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import driverOrdersReducer from './slices/driverOrdersSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    driverOrders: driverOrdersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/restoreAuth/fulfilled'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
