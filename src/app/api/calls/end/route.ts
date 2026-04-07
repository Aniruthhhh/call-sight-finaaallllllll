import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { callId, outcome, notes, followUpAt } = await req.json()
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch call record
    const { data: call, error: fetchError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single()

    if (fetchError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (call.sales_rep_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You did not start this call' }, { status: 403 })
    }

    const updateData: any = {
      outcome,
      notes,
      follow_up_at: followUpAt || null,
    }

    // If not locked by telecom verification, we set our own duration/end_time
    if (!call.locked) {
      const endTime = new Date()
      const startTime = new Date(call.start_time)
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      
      updateData.end_time = endTime.toISOString()
      updateData.duration = duration
      updateData.locked = true // Lock it now
    }

    // Update call record
    const { error: updateError } = await supabaseAdmin
      .from('calls')
      .update(updateData)
      .eq('id', callId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Lead status automation
    let leadStatus = 'completed'
    if (outcome === 'Interested') {
      leadStatus = 'Follow-Up'
    } else if (outcome === 'Not Interested') {
      leadStatus = 'Closed'
    } else if (outcome === 'No Answer') {
      leadStatus = 'Pending'
    } else if (outcome === 'Busy') {
      leadStatus = 'Follow-Up'
    } else {
      leadStatus = 'completed'
    }

    // Update lead
    await supabaseAdmin
      .from('leads')
      .update({ 
        status: leadStatus,
        last_contact: new Date().toISOString()
      })
      .eq('id', call.lead_id)

    // Handle Follow-ups
    await supabaseAdmin
      .from('follow_ups')
      .update({ completed: true })
      .eq('lead_id', call.lead_id)
      .eq('completed', false)

    if (followUpAt) {
      await supabaseAdmin
        .from('follow_ups')
        .insert({
          lead_id: call.lead_id,
          executive_id: user.id,
          scheduled_for: followUpAt,
          completed: false,
          notes: notes
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('End Call Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
