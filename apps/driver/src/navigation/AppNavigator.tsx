import React from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useDispatch, useSelector } from 'react-redux'
import { restoreAuth } from '@/store/slices/authSlice'
import type { RootState, AppDispatch } from '@/store'
import { useEffect } from 'react'
import { DriverLoginScreen } from '@/screens/auth/DriverLoginScreen'
import { AvailableOrdersScreen } from '@/screens/orders/AvailableOrdersScreen'
import { MyOrdersScreen } from '@/screens/orders/MyOrdersScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DriverLogin"
        component={DriverLoginScreen}
        options={{ animationEnabled: false }}
      />
    </Stack.Navigator>
  )
}

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="AvailableOrdersTab"
        component={AvailableOrdersScreen}
        options={{
          tabBarLabel: 'Available',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🎯</Text>,
        }}
      />
      <Tab.Screen
        name="MyOrdersTab"
        component={MyOrdersScreen}
        options={{
          tabBarLabel: 'My Orders',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📦</Text>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  )
}

function ProfileScreen() {
  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-2xl font-bold">Driver Profile Coming Soon</Text>
    </View>
  )
}

function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const loading = useSelector((state: RootState) => state.auth.loading)

  useEffect(() => {
    dispatch(restoreAuth())
  }, [dispatch])

  if (loading) {
    return null // Show splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen
            name="App"
            component={DriverTabs}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthStack}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
