import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'

export default function Index() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/(auth)/login')
      } else if (profile?.role === 'executive') {
        router.replace('/(tabs)/executive')
      } else if (profile?.role === 'manager') {
        router.replace('/(tabs)/manager')
      }
    }
  }, [user, profile, loading])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3B82F6' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  )
}
