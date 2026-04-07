import { Stack } from 'expo-router'

export default function ExecutiveLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="leads" />
      <Stack.Screen name="dialer" />
      <Stack.Screen name="follow-ups" />
      <Stack.Screen name="performance" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
