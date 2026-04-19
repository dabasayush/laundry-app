import React, { useState } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { OtpScreen } from "@/screens/auth/OtpScreen";
import { OnboardingScreen } from "@/screens/auth/OnboardingScreen";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { OrdersScreen } from "@/screens/orders/OrdersScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<
    "login" | "otp" | "onboarding" | "authenticated"
  >("login");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const { setAuthenticated } = useAuth();

  const handlePhoneSubmit = (phoneNumber: string) => {
    console.log("[AuthStack] Phone submitted:", phoneNumber);
    setPhone(phoneNumber);
    setStep("otp");
  };

  const handleOtpSuccess = (firstTime: boolean) => {
    console.log("[AuthStack] OTP verified, isFirstTime:", firstTime);
    setIsFirstTime(firstTime);

    if (firstTime) {
      // New user - show onboarding
      setStep("onboarding");
    } else {
      // Existing user - skip onboarding and go to home
      console.log("[AuthStack] Existing user, skipping onboarding");
      setAuthenticated(true, false);
      setStep("authenticated");
    }
  };

  const handleOnboardingSuccess = () => {
    console.log(
      "[AuthStack] Onboarding completed, marking user as authenticated",
    );
    setAuthenticated(true, true);
    setStep("authenticated");
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {step === "login" && (
        <Stack.Screen
          name="Login"
          options={{ animationTypeForReplace: undefined }}
        >
          {() => <LoginScreen onSuccess={handlePhoneSubmit} />}
        </Stack.Screen>
      )}
      {step === "otp" && (
        <Stack.Screen
          name="Otp"
          options={{ animationTypeForReplace: undefined }}
        >
          {() => (
            <OtpScreen
              phone={phone}
              onSuccess={handleOtpSuccess}
              onBack={() => setStep("login")}
            />
          )}
        </Stack.Screen>
      )}
      {step === "onboarding" && (
        <Stack.Screen
          name="Onboarding"
          options={{ animationTypeForReplace: undefined }}
        >
          {() => (
            <OnboardingScreen
              phone={phone}
              onSuccess={handleOnboardingSuccess}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

function HomeTabs() {
  const COLORS = {
    primary: "#1F4D3A",
    primaryLight: "#D1FAE5",
    textMuted: "#64748B",
    text: "#1E293B",
    border: "#E2E8F0",
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          backgroundColor: "#FFFFFF",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Services",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="hanger" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Cart",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cart" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          tabBarLabel: "Orders",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="package-variant"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  console.log(
    "[AppNavigator] Current state - isAuthenticated:",
    isAuthenticated,
    "loading:",
    loading,
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {console.log("[AppNavigator] Rendering HomeTabs (authenticated)")}
            <Stack.Screen name="App" component={HomeTabs} />
          </>
        ) : (
          <>
            {console.log(
              "[AppNavigator] Rendering AuthStack (not authenticated)",
            )}
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
