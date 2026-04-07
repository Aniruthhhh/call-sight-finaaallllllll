import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'

export default function FollowUpsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [followUps, setFollowUps] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchFollowUps = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('follow_ups')
      .select(`*, leads (name, company, phone)`)
      .eq('executive_id', user.id)
      .order('scheduled_for', { ascending: true })

    if (data) setFollowUps(data)
  }

  useEffect(() => {
    fetchFollowUps()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchFollowUps()
    setRefreshing(false)
  }

  const markComplete = async (id: string) => {
    await supabase
      .from('follow_ups')
      .update({ completed: true })
      .eq('id', id)
    
    fetchFollowUps()
  }

  const isOverdue = (date: string) => new Date(date) < new Date()
  const isToday = (date: string) => {
    const today = new Date()
    const followUpDate = new Date(date)
    return today.toDateString() === followUpDate.toDateString()
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow-Ups</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {followUps.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#E2E8F0" />
            <Text style={styles.emptyText}>No follow-ups scheduled</Text>
          </View>
        ) : (
          followUps.map((fu) => {
            const overdue = isOverdue(fu.scheduled_for)
            const today = isToday(fu.scheduled_for)
            
            return (
              <View key={fu.id} style={styles.followUpCard}>
                <View style={styles.followUpHeader}>
                  <View style={[styles.statusDot, { 
                    backgroundColor: fu.completed ? '#10B981' : overdue ? '#EF4444' : '#3B82F6' 
                  }]} />
                  <View style={styles.followUpInfo}>
                    <Text style={styles.leadName}>{fu.leads?.name}</Text>
                    {fu.leads?.company && (
                      <Text style={styles.company}>{fu.leads.company}</Text>
                    )}
                  </View>
                  {!fu.completed && (
                    <TouchableOpacity 
                      style={styles.completeButton}
                      onPress={() => markComplete(fu.id)}
                    >
                      <Ionicons name="checkmark" size={20} color="#10B981" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.followUpDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      {new Date(fu.scheduled_for).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      {new Date(fu.scheduled_for).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>

                {fu.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{fu.notes}</Text>
                  </View>
                )}

                {!fu.completed && (
                  <View style={styles.badges}>
                    {overdue && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueText}>OVERDUE</Text>
                      </View>
                    )}
                    {today && !overdue && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>TODAY</Text>
                      </View>
                    )}
                  </View>
                )}

                {fu.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
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
  followUpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  followUpInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  company: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  completeButton: {
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  followUpDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EF4444',
  },
  todayBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3B82F6',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
})
