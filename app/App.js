import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import Dashboard from "./screens/Dashboard";
import Settings from "./screens/Settings";
import ThemeProvider, { useTheme } from "./context/ThemeContext";

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { theme, dark } = useTheme();

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.tabBg,
      border: theme.border,
      text: theme.text,
    },
  };

  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => {
              const icons = {
                Dashboard: focused ? "📊" : "📉",
                Settings: focused ? "⚙️" : "🔧",
              };
              return <Text style={{ fontSize: 22 }}>{icons[route.name]}</Text>;
            },
            tabBarActiveTintColor: theme.tabActive,
            tabBarInactiveTintColor: theme.tabInactive,
            tabBarStyle: {
              backgroundColor: theme.tabBg,
              borderTopColor: theme.border,
              height: 62,
              paddingBottom: 8,
            },
            tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
            headerStyle: { backgroundColor: theme.tabBg },
            headerTintColor: theme.text,
            headerTitleStyle: { fontWeight: "700", fontSize: 18 },
            headerShadowVisible: false,
          })}
        >
          <Tab.Screen
            name="Dashboard"
            component={Dashboard}
            options={{ title: "Dashboard", headerTitle: "GripSense" }}
          />
          <Tab.Screen
            name="Settings"
            component={Settings}
            options={{ title: "Settings", headerTitle: "Settings" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
