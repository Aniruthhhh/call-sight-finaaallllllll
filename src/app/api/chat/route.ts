import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userQuestion = messages[messages.length - 1].content;

    // 1. Fetch All Profiles for mapping (since some FKs might be missing)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');
    
    const profileMap = new Map(allProfiles?.map(p => [p.id, p.full_name]) || []);
    const repNames = allProfiles?.filter(p => p.role === 'executive').map(p => p.full_name) || [];

    // 2. Fetch Leads
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch Calls
    const { data: calls } = await supabase
      .from('calls')
      .select('*, leads(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    // 4. Fetch Follow-Ups
    const { data: followUps } = await supabase
      .from('follow_ups')
      .select('*, leads(name)')
      .order('scheduled_for', { ascending: true });

    // Format data as requested by the template
    const formattedLeads = leads?.map(l => {
      const assignedTo = l.assigned_to ? profileMap.get(l.assigned_to) : 'Unassigned';
      return `Name: ${l.name}, Company: ${l.company}, Status: ${l.status}, Assigned To: ${assignedTo}, Last Call: ${l.last_contact || 'None'}, Last Outcome: ${l.metadata?.last_outcome || 'N/A'}, Follow-up At: ${l.metadata?.follow_up_at || 'N/A'}`;
    }).join('\n') || 'None';

    const formattedCalls = calls?.map(c => {
      const exec = c.sales_rep_id ? profileMap.get(c.sales_rep_id) : 'Unknown';
      return `Lead: ${(c.leads as any)?.name || 'Unknown'}, Executive: ${exec}, Date: ${c.created_at}, Duration: ${c.duration}s, Outcome: ${c.outcome}`;
    }).join('\n') || 'None';

    const formattedFollowUps = followUps?.map(f => {
      const exec = f.executive_id ? profileMap.get(f.executive_id) : 'Unknown';
      return `Lead: ${(f.leads as any)?.name || 'Unknown'}, Executive: ${exec}, Due Date: ${f.scheduled_for}, Status: ${f.completed ? 'Completed' : 'Pending'}`;
    }).join('\n') || 'None';

    const systemPrompt = `You are CallSight’s AI Sales Operations Assistant for the Manager (Ram).
Your role is to help the manager understand lead status, follow-ups, salesperson performance, and revenue risk using system data.

You must:
- Answer only using the data provided
- Be concise, clear, and business-focused
- Highlight risks, delays, and missed follow-ups
- Use professional sales language
- Never invent data

Behavior Rules:
1. Identify overdue follow-ups
2. Flag leads with no recent calls
3. Compare ex1 vs ex2 when relevant (Reps: ${repNames.join(', ')})
4. Prioritize revenue risk
5. Reference lead names and reps`;

    const userPromptTemplate = `Here is the current sales data snapshot. Use it to answer the manager’s question.

Leads:
${formattedLeads}

Calls:
${formattedCalls}

Follow-Ups:
${formattedFollowUps}

Sales Reps:
${repNames.join(', ')}

Manager Question:
${userQuestion}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(0, -1),
        { role: 'user', content: userPromptTemplate }
      ],
      temperature: 0,
      max_tokens: 800,
    });

    return NextResponse.json({
      message: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
