import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function LeadsScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leads</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <Ionicons name="list" size={64} color="#8B5CF6" />
        <Text style={styles.title}>Lead Management</Text>
        <Text style={styles.subtitle}>Assign and track all leads</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#3B82F6',
    padding: 16,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 8 },
})
