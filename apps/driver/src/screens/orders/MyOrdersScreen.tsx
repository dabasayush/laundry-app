import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import { styled } from 'nativewind'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyOrders } from '@/store/slices/driverOrdersSlice'
import type { RootState, AppDispatch } from '@/store'

const Container = styled(View)
const Header = styled(View)
const Title = styled(Text)

interface MyOrdersScreenProps {
  onNavigate: (screen: string, params?: any) => void
}

export function MyOrdersScreen({ onNavigate }: MyOrdersScreenProps) {
  const dispatch = useDispatch<AppDispatch>()
  const acceptedOrders = useSelector((state: RootState) => state.driverOrders.acceptedOrders)
  const completedOrders = useSelector((state: RootState) => state.driverOrders.completedOrders)
  const loading = useSelector((state: RootState) => state.driverOrders.loading)

  useEffect(() => {
    dispatch(fetchMyOrders(undefined))
  }, [dispatch])

  const statusConfig: { [key: string]: string } = {
    PENDING: '⏳ Pending',
    PICKUP_ASSIGNED: '📍 Pickup Assigned',
    PICKED_UP: '📦 Picked Up',
    PROCESSING: '⚙️ Processing',
    OUT_FOR_DELIVERY: '🚚 Out for Delivery',
    DELIVERED: '✅ Delivered',
    CANCELLED: '❌ Cancelled',
  }

  return (
    <Container className="flex-1 bg-gray-50">
      <Header className="bg-gradient-to-r from-primary to-primary-light px-6 pt-4 pb-6 rounded-b-3xl">
        <Title className="text-white text-3xl font-bold">My Orders</Title>
        <Text className="text-blue-100 mt-1">Track your deliveries</Text>
      </Header>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Active Orders */}
        {acceptedOrders.length > 0 && (
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">📦 Active Deliveries</Text>
            <FlatList
              data={acceptedOrders}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onNavigate('OrderDetail', { orderId: item.id })}
                  className="bg-white rounded-2xl p-4 mb-3 border-2 border-blue-300 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-gray-900">
                      Order #{item.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                      {statusConfig[item.status] || item.status}
                    </Text>
                  </View>

                  <View className="bg-gray-50 p-2 rounded mb-2">
                    <Text className="text-xs text-gray-600">📍 {item.address?.city}</Text>
                  </View>

                  <Text className="font-bold text-lg text-green-600">
                    Earning: ₹{item.finalAmount}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <View>
            <Text className="text-2xl font-bold text-gray-900 mb-3">✅ Completed</Text>
            <FlatList
              data={completedOrders}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onNavigate('OrderDetail', { orderId: item.id })}
                  className="bg-white rounded-2xl p-3 mb-2 border border-gray-200"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">
                        Order #{item.id.slice(0, 8).toUpperCase()}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-green-600">₹{item.finalAmount}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {loading && acceptedOrders.length === 0 && completedOrders.length === 0 && (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        )}

        {!loading && acceptedOrders.length === 0 && completedOrders.length === 0 && (
          <View className="flex-1 justify-center items-center">
            <Text className="text-4xl mb-2">🎯</Text>
            <Text className="font-semibold text-gray-900">No active orders</Text>
            <Text className="text-gray-600 text-center mt-2">
              Check Available Orders tab to start earning
            </Text>
          </View>
        )}
      </ScrollView>
    </Container>
  )
}
