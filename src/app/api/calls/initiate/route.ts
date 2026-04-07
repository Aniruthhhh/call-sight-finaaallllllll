// CLEAN_INITIATE_ROUTE
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

export async function POST(req: Request) {
  try {
    const { leadId } = await req.json()
    const auth_header_val = req.headers.get('Authorization')

    if (!auth_header_val) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = auth_header_val.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is Sales Executive and lead belongs to them
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'executive') {
      return NextResponse.json({ error: 'Forbidden: Only executives can start calls' }, { status: 403 })
    }

    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('assigned_to, phone')
      .eq('id', leadId)
      .single()

    if (lead?.assigned_to !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Lead not assigned to you' }, { status: 403 })
    }

    // Insert new call record
    const { data: call, error: callError } = await supabaseAdmin
      .from('calls')
      .insert({
        lead_id: leadId,
        sales_rep_id: user.id,
        start_time: new Date().toISOString(),
        locked: false
      })
      .select()
      .single()

    if (callError) {
      return NextResponse.json({ error: callError.message }, { status: 500 })
    }

    let twilioSid = null

    // Check if CALL_MODE is TWILIO and credentials are present
    if (process.env.CALL_MODE === 'TWILIO' && 
        process.env.TWILIO_ACCOUNT_SID && 
        process.env.TWILIO_AUTH_TOKEN && 
        process.env.TWILIO_PHONE_NUMBER) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        
        // Determine host for callback URLs
        const referer = req.headers.get('referer')
        let detectedUrl = null
        if (referer) {
          try {
            const refUrl = new URL(referer)
            detectedUrl = `${refUrl.protocol}//${refUrl.host}`
          } catch (e) {}
        }

        // Use APP_URL if set, otherwise fallback to detected URL
        const baseUrl = process.env.APP_URL || detectedUrl
        
        if (!baseUrl || baseUrl.includes('localhost')) {
          console.error('Twilio Configuration Error: APP_URL is not set to a public URL.')
          throw new Error('Public APP_URL is required for Twilio webhooks.')
        }

        const userPhone = process.env.USER_PHONE_NUMBER;
        if (!userPhone) {
          throw new Error('Twilio Configuration Error: USER_PHONE_NUMBER is not set in environment.');
        }

        const twilioCall = await client.calls.create({
          to: userPhone, // Dial the salesperson FIRST!
          from: process.env.TWILIO_PHONE_NUMBER,
          url: `${baseUrl}/api/twilio-voice?phone=${encodeURIComponent(lead.phone)}`,
          statusCallback: `${baseUrl}/api/twilio-webhook`,
          statusCallbackEvent: ['completed'],
          statusCallbackMethod: 'POST'
        })

        twilioSid = twilioCall.sid

        // Update call record with twilio_sid
        await supabaseAdmin
          .from('calls')
          .update({ twilio_sid: twilioSid })
          .eq('id', call.id)

      } catch (err: any) {
        console.error('Twilio Error:', err.message)
      }
    }

    return NextResponse.json({ 
      callId: call.id, 
      twilioSid,
      mode: twilioSid ? 'TWILIO' : 'SIMULATED'
    })
  } catch (error) {
    console.error('Start Call Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
