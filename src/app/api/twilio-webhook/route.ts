import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const twilioSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const duration = formData.get('CallDuration') as string

    if (callStatus === 'completed' && twilioSid) {
      // Find the call by twilio_sid
      const { data: call } = await supabaseAdmin
        .from('calls')
        .select('id')
        .eq('twilio_sid', twilioSid)
        .single()

      if (call) {
        await supabaseAdmin
          .from('calls')
          .update({
            end_time: new Date().toISOString(),
            duration: parseInt(duration, 10) || 0,
            locked: true
          })
          .eq('id', call.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Twilio Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
