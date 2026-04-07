import { Stack } from 'expo-router'

export default function ManagerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="team" />
      <Stack.Screen name="leads" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
