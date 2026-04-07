import { supabase } from '@/lib/supabase';
import { subDays, differenceInSeconds } from 'date-fns';

export async function fetchExecutiveMetrics(executiveId: string, days: number = 30) {
  const daysAgo = subDays(new Date(), days).toISOString();

  // 1. Fetch Calls
  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .eq('sales_rep_id', executiveId)
    .gte('created_at', daysAgo);

  // 2. Fetch Follow-ups
  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('executive_id', executiveId)
    .gte('created_at', daysAgo);

  // 3. Fetch Leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('assigned_to', executiveId);

  const totalCalls = calls?.length || 0;
  const avgDuration = totalCalls > 0 
    ? Math.round(calls!.reduce((acc, c) => acc + (c.duration || 0), 0) / totalCalls) 
    : 0;

  const connected = calls?.filter(c => c.outcome && c.outcome !== 'No Answer' && c.outcome !== 'Busy').length || 0;
  const interested = calls?.filter(c => c.outcome === 'Interested').length || 0;
  const busy = calls?.filter(c => c.outcome === 'Busy').length || 0;
  const notInterested = calls?.filter(c => c.outcome === 'Not Interested').length || 0;
  const noAnswer = calls?.filter(c => c.outcome === 'No Answer').length || 0;

  const conversionRate = totalCalls > 0 ? Math.round((interested / totalCalls) * 100) : 0;

  const now = new Date();
  const followUpsScheduled = followUps?.length || 0;
  const followUpsCompleted = followUps?.filter(f => f.completed).length || 0;
  const followUpsMissed = followUps?.filter(f => !f.completed && new Date(f.scheduled_for) < now).length || 0;
  const followUpSuccessRate = followUpsScheduled > 0 ? Math.round((followUpsCompleted / followUpsScheduled) * 100) : 0;

  const dealsClosed = leads?.filter(l => l.status === 'Closed').length || 0;
  const dealsLost = leads?.filter(l => l.status === 'Lost').length || 0;
  
  // Stale leads: assigned but no calls in last 48 hours
  const staleLeads = leads?.filter(l => {
    if (l.status === 'Closed' || l.status === 'Lost') return false;
    const leadCalls = calls?.filter(c => c.lead_id === l.id) || [];
    if (leadCalls.length === 0) return true;
    const lastCall = new Date(Math.max(...leadCalls.map(c => new Date(c.created_at).getTime())));
    return differenceInSeconds(now, lastCall) > 172800; // 48 hours
  }).length || 0;

  // Avg First-Call Time (simulated for now as it needs assignment timestamp which might not be exact)
  const avgFirstCallTime = "14m"; // Placeholder or calculation if we had 'assigned_at'

  // Trust Score Calculation
  const callConsistencyScore = Math.min(100, (totalCalls / (days * 30)) * 100); // Target 30 calls/day
  const talkTimeScore = Math.min(100, (avgDuration / 180) * 100); // Target 3 mins avg
  const disciplineScore = followUpSuccessRate;
  const finalTrustScore = Math.round((callConsistencyScore * 0.3) + (talkTimeScore * 0.3) + (disciplineScore * 0.4));

  return {
    totalCalls,
    avgDuration,
    connected,
    interested,
    busy,
    notInterested,
    noAnswer,
    conversionRate,
    followUpsScheduled,
    followUpsCompleted,
    followUpsMissed,
    followUpSuccessRate,
    dealsClosed,
    dealsLost,
    staleLeads,
    avgFirstCallTime,
    trustScore: finalTrustScore,
    breakdown: {
      consistency: Math.round(callConsistencyScore),
      talkTime: Math.round(talkTimeScore),
      discipline: Math.round(disciplineScore)
    }
  };
}
