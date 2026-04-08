import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { leadId, leadName, phoneNumber, callSid, duration, outcome, transcriptText, callStartTime, callEndTime } = await req.json()

    // Generate AI summary asynchronously if transcript available and length is sufficient
    let aiSummary = null
    if (transcriptText && transcriptText.trim().length > 50) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a sales call analyzer. Summarize the given sales call transcription into a structured JSON with these exact keys:
              - intent: Customer's intent/goal
              - discussion: Key discussion points
              - objections: Any objections raised (or "None")
              - interest_level: Hot / Warm / Cold
              - next_action: Recommended next action

              Respond ONLY with a valid JSON object. No markdown, no extra text.`
            },
            {
              role: 'user',
              content: `Transcription:\n${transcriptText}`
            }
          ],
          max_tokens: 400,
          temperature: 0.3
        })

        const raw = completion.choices[0]?.message?.content?.trim() || ''
        try {
          aiSummary = JSON.parse(raw)
        } catch {
          aiSummary = { intent: raw, discussion: '', objections: 'None', interest_level: 'Warm', next_action: 'Follow up' }
        }
      } catch (e) {
        console.error('AI summary generation failed:', e)
      }
    }

    // Save the call log record
    const { data, error } = await supabaseAdmin
      .from('call_logs')
      .insert({
        executive_id: user.id,
        lead_id: leadId,
        lead_name: leadName,
        phone_number: phoneNumber,
        call_start_time: callStartTime || new Date().toISOString(),
        call_end_time: callEndTime || new Date().toISOString(),
        duration: duration || 0,
        call_outcome: outcome,
        transcription: transcriptText || null,
        ai_summary: aiSummary
      })
      .select()
      .single()

    if (error) {
      console.error('Call log save error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, logId: data?.id })
  } catch (error: any) {
    console.error('Call Logs Save Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
