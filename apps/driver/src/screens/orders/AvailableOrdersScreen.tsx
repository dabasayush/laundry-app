import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native'
import { styled } from 'nativewind'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAvailableOrders, acceptOrder } from '@/store/slices/driverOrdersSlice'
import type { RootState, AppDispatch } from '@/store'
import type { Order } from '@laundry/shared-types'

const Container = styled(View)
const Header = styled(View)
const Title = styled(Text)

interface AvailableOrdersScreenProps {
  onNavigate: (screen: string, params?: any) => void
}

export function AvailableOrdersScreen({ onNavigate }: AvailableOrdersScreenProps) {
  const dispatch = useDispatch<AppDispatch>()
  const orders = useSelector((state: RootState) => state.driverOrders.availableOrders)
  const loading = useSelector((state: RootState) => state.driverOrders.loading)

  useEffect(() => {
    dispatch(fetchAvailableOrders())
    const timer = setInterval(() => {
      dispatch(fetchAvailableOrders())
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(timer)
  }, [dispatch])

  const handleAcceptOrder = async (orderId: string) => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await dispatch(acceptOrder(orderId)).unwrap()
              Alert.alert('Success', 'Order accepted! Check your orders list.')
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to accept order')
            }
          },
        },
      ]
    )
  }

  return (
    <Container className="flex-1 bg-gray-50">
      <Header className="bg-gradient-to-r from-primary to-primary-light px-6 pt-4 pb-6 rounded-b-3xl">
        <Title className="text-white text-3xl font-bold">Available Orders</Title>
        <Text className="text-blue-100 mt-1">Tap to accept and start earning 💰</Text>
      </Header>

      <ScrollView className="flex-1 px-6 py-4">
        {loading && orders.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-gray-600 mt-2">Finding orders for you...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-4xl mb-2">📭</Text>
            <Text className="text-xl font-semibold text-gray-900">No orders available</Text>
            <Text className="text-gray-600 text-center mt-2">Pull down to refresh</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onNavigate('OrderDetail', { orderId: item.id })}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900">
                      Order #{item.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-800 font-bold">₹{item.finalAmount}</Text>
                  </View>
                </View>

                <View className="bg-gray-50 p-3 rounded-lg mb-3">
                  <Text className="text-xs text-gray-600 mb-1">📍 Customer Address</Text>
                  <Text className="text-sm font-semibold text-gray-900 leading-5">
                    {item.address?.line1}, {item.address?.city} - {item.address?.pincode}
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleAcceptOrder(item.id)}
                    className="flex-1 bg-green-600 py-3 rounded-lg items-center"
                  >
                    <Text className="text-white font-bold">✓ Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onNavigate('RejectOrder', { orderId: item.id })}
                    className="flex-1 bg-red-100 py-3 rounded-lg items-center border border-red-300"
                  >
                    <Text className="text-red-600 font-bold">✕ Decline</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
    </Container>
  )
}
