import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'

export default function PerformanceScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    successRate: 0,
    totalLeads: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .eq('sales_rep_id', user.id)

      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)

      if (calls) {
        const totalDuration = calls.reduce((acc, call) => acc + (call.duration || 0), 0)
        const successfulCalls = calls.filter(c => 
          c.outcome === 'Interested' || c.outcome === 'Connected'
        ).length

        setStats({
          totalCalls: calls.length,
          avgDuration: calls.length > 0 ? Math.round(totalDuration / calls.length) : 0,
          successRate: calls.length > 0 ? Math.round((successfulCalls / calls.length) * 100) : 0,
          totalLeads: leadsCount || 0,
        })
      }
    }

    fetchStats()
  }, [user])

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Calls" 
            value={stats.totalCalls} 
            icon="call" 
            color="#3B82F6"
          />
          <StatCard 
            title="Avg Duration" 
            value={`${Math.floor(stats.avgDuration / 60)}m ${stats.avgDuration % 60}s`}
            icon="time" 
            color="#8B5CF6"
          />
          <StatCard 
            title="Success Rate" 
            value={`${stats.successRate}%`}
            icon="trending-up" 
            color="#10B981"
          />
          <StatCard 
            title="Total Leads" 
            value={stats.totalLeads}
            icon="people" 
            color="#F59E0B"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERFORMANCE INSIGHTS</Text>
          <View style={styles.insightCard}>
            <Ionicons name="analytics" size={48} color="#3B82F6" />
            <Text style={styles.insightTitle}>Detailed Analytics</Text>
            <Text style={styles.insightText}>
              View comprehensive performance metrics, call history, and conversion trends on the web dashboard.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 16,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 12,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 16,
  },
  insightText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
})
