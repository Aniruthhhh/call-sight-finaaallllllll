import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'

export default function ManagerDashboard() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    conversionRate: 0,
    missedFollowUps: 0,
  })
  const [teamPerformance, setTeamPerformance] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: calls } = await supabase
      .from('calls')
      .select('*, profiles:sales_rep_id(full_name)')
      .gte('created_at', today.toISOString())

    if (calls) {
      const totalDuration = calls.reduce((acc, c) => acc + (c.duration || 0), 0)
      const interested = calls.filter(c => c.outcome === 'Interested' || c.outcome === 'Connected').length

      setStats({
        totalCalls: calls.length,
        avgDuration: calls.length > 0 ? Math.round(totalDuration / calls.length) : 0,
        conversionRate: calls.length > 0 ? Math.round((interested / calls.length) * 100) : 0,
        missedFollowUps: 0,
      })

      // Team performance
      const teamMap = new Map()
      calls.forEach(c => {
        const name = c.profiles?.full_name || 'Unknown'
        if (!teamMap.has(name)) {
          teamMap.set(name, { name, calls: 0, connected: 0 })
        }
        const data = teamMap.get(name)
        data.calls++
        if (c.outcome === 'Interested' || c.outcome === 'Connected') data.connected++
      })

      const teamData = Array.from(teamMap.values()).map(member => ({
        ...member,
        score: member.calls > 0 ? Math.round((member.connected / member.calls) * 100) : 0
      }))
      setTeamPerformance(teamData.sort((a, b) => b.score - a.score))
    }

    const { count: missedCount } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('completed', false)
      .lt('scheduled_for', new Date().toISOString())

    setStats(prev => ({ ...prev, missedFollowUps: missedCount || 0 }))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Manager Dashboard</Text>
          <Text style={styles.name}>{profile?.full_name || 'Manager'}</Text>
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
          <KPICard title="Calls Today" value={stats.totalCalls} icon="call" color="#3B82F6" />
          <KPICard 
            title="Avg Duration" 
            value={`${Math.floor(stats.avgDuration / 60)}m`}
            icon="time" 
            color="#8B5CF6" 
          />
          <KPICard 
            title="Conversion" 
            value={`${stats.conversionRate}%`}
            icon="trending-up" 
            color="#10B981" 
          />
          <KPICard 
            title="Missed" 
            value={stats.missedFollowUps}
            icon="alert-circle" 
            color={stats.missedFollowUps > 0 ? '#EF4444' : '#10B981'} 
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionGrid}>
            <ActionCard 
              title="Team" 
              icon="people" 
              color="#3B82F6"
              onPress={() => router.push('/(tabs)/manager/team')}
            />
            <ActionCard 
              title="Leads" 
              icon="list" 
              color="#8B5CF6"
              onPress={() => router.push('/(tabs)/manager/leads')}
            />
            <ActionCard 
              title="Reports" 
              icon="stats-chart" 
              color="#10B981"
              onPress={() => router.push('/(tabs)/manager/reports')}
            />
            <ActionCard 
              title="Settings" 
              icon="settings" 
              color="#F59E0B"
              onPress={() => router.push('/(tabs)/manager/settings')}
            />
          </View>
        </View>

        {/* Team Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEAM PERFORMANCE</Text>
          {teamPerformance.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#E2E8F0" />
              <Text style={styles.emptyText}>No team data available</Text>
            </View>
          ) : (
            <View style={styles.teamList}>
              {teamPerformance.map((member, i) => (
                <View key={member.name} style={styles.teamItem}>
                  <View style={styles.teamRank}>
                    <Text style={styles.rankText}>#{i + 1}</Text>
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamStats}>
                      {member.calls} calls • {member.connected} connected
                    </Text>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>{member.score}%</Text>
                  </View>
                </View>
              ))}
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
  },
  teamList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  teamRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  teamStats: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3B82F6',
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
    marginTop: 12,
  },
})
