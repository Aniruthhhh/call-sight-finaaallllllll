import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'

export default function ExecutiveDashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ 
    leadsAssigned: 0, 
    callsToday: 0, 
    followUpsDue: 0, 
    conversionRate: 0 
  })
  const [recentFollowUps, setRecentFollowUps] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    if (!user) return
    
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: callsCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('sales_rep_id', user.id)
      .gte('created_at', today.toISOString())

    const { count: followUpsCount } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('executive_id', user.id)
      .eq('completed', false)
      .lte('scheduled_for', new Date().toISOString())

    const { count: closedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('status', 'closed')

    const conversionRate = leadsCount ? (closedCount || 0) / leadsCount * 100 : 0

    setStats({
      leadsAssigned: leadsCount || 0,
      callsToday: callsCount || 0,
      followUpsDue: followUpsCount || 0,
      conversionRate: Math.round(conversionRate)
    })

    const { data: followUpsData } = await supabase
      .from('follow_ups')
      .select(`*, leads (name)`)
      .eq('executive_id', user.id)
      .eq('completed', false)
      .order('scheduled_for', { ascending: true })
      .limit(3)

    if (followUpsData) setRecentFollowUps(followUpsData)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.full_name || 'Executive'}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <KPICard title="Leads" value={stats.leadsAssigned} icon="people" color="#3B82F6" />
          <KPICard title="Calls Today" value={stats.callsToday} icon="call" color="#3B82F6" />
          <KPICard title="Follow-Ups" value={stats.followUpsDue} icon="time" color={stats.followUpsDue > 0 ? '#EF4444' : '#10B981'} />
          <KPICard title="Conversion" value={`${stats.conversionRate}%`} icon="trending-up" color="#10B981" />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionGrid}>
            <ActionCard 
              title="Start Calling" 
              icon="call" 
              color="#3B82F6"
              onPress={() => router.push('/(tabs)/executive/dialer')}
            />
            <ActionCard 
              title="View Leads" 
              icon="list" 
              color="#8B5CF6"
              onPress={() => router.push('/(tabs)/executive/leads')}
            />
            <ActionCard 
              title="Follow-Ups" 
              icon="calendar" 
              color="#F59E0B"
              onPress={() => router.push('/(tabs)/executive/follow-ups')}
            />
            <ActionCard 
              title="Performance" 
              icon="stats-chart" 
              color="#10B981"
              onPress={() => router.push('/(tabs)/executive/performance')}
            />
          </View>
        </View>

        {/* Today's Focus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S FOCUS</Text>
          {recentFollowUps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#E2E8F0" />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          ) : (
            <View style={styles.followUpList}>
              {recentFollowUps.map((fu) => {
                const isOverdue = new Date(fu.scheduled_for) < new Date()
                return (
                  <TouchableOpacity key={fu.id} style={styles.followUpItem}>
                    <View style={[styles.followUpDot, { backgroundColor: isOverdue ? '#EF4444' : '#3B82F6' }]} />
                    <View style={styles.followUpContent}>
                      <Text style={styles.followUpName}>{(fu.leads as any)?.name}</Text>
                      <Text style={styles.followUpTime}>
                        {new Date(fu.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    {isOverdue && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueText}>OVERDUE</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function KPICard({ title, value, icon, color }: any) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
    </View>
  )
}

function ActionCard({ title, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={32} color="#fff" />
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#BFDBFE',
    fontWeight: '600',
  },
  name: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '900',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 8,
  },
  kpiTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  followUpList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  followUpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  followUpDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  followUpContent: {
    flex: 1,
  },
  followUpName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  followUpTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EF4444',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 12,
  },
})
