import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { styled } from 'nativewind'
import { driverLogin } from '@/services/auth.service'
import { useDispatch } from 'react-redux'
import { setDriver, setTokens } from '@/store/slices/authSlice'
import type { AppDispatch } from '@/store'

const Container = styled(View)
const Header = styled(Text)
const Input = styled(TextInput)
const Button = styled(TouchableOpacity)
const ErrorText = styled(Text)

interface DriverLoginScreenProps {
  onSuccess: () => void
}

export function DriverLoginScreen({ onSuccess }: DriverLoginScreenProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!phone || !password) {
      setError('Please enter both phone and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await driverLogin(phone, password)
      dispatch(setDriver(response.driver))
      dispatch(setTokens(response.tokens))
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="flex-1 bg-white">
      <ScrollView className="p-6 flex-1 justify-center">
        <Header className="text-3xl font-bold text-center text-primary mb-2">Laundry Driver</Header>
        <Text className="text-center text-gray-600 mb-8">Delivery & Earnings Management</Text>

        {error && (
          <ErrorText className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</ErrorText>
        )}

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Phone Number</Text>
          <Input
            className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
            placeholder="10-digit mobile"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
            editable={!loading}
          />
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Password</Text>
          <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
            <Input
              className="flex-1 text-lg"
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text className="text-gray-600 text-lg">{showPassword ? '👁️‍🗨️' : '🚫'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          onPress={handleLogin}
          disabled={loading}
          className="bg-primary py-4 rounded-lg flex-row justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold">Login</Text>
          )}
        </Button>

        <Text className="text-center text-gray-600 text-sm mt-6">
          Contact admin if you don't have credentials
        </Text>
      </ScrollView>
    </Container>
  )
}
