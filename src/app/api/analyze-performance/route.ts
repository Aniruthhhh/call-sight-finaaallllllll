import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
  let data;
  try {
    data = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const fallbackResponse = {
    summary: `Performance analysis for ${data.name} is currently in simplified mode. Based on system metrics, ${data.name} has a conversion rate of ${data.conversionRate}% and a trust score of ${data.trustScore}/100. Their calling consistency is ${data.breakdown?.consistency || 'stable'}, with an average duration of ${data.avgDuration}s per call.`,
    improvements: `• Maintain higher call volume to reach the daily target consistency.\n• Focus on reducing missed follow-ups (${data.followUpsMissed}) to improve trust score.\n• Target longer average durations on interested leads to drive conversion.`
  };

  if (!openai || !process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackResponse);
  }

  try {
    const systemPrompt = `You are a senior sales performance analyst for CallSight.
Your job is to analyze system-verified sales data and provide a clear, unbiased performance summary and improvement recommendations.
Focus on revenue impact, discipline, engagement quality, and follow-up behavior.`;

    const userPrompt = `Analyze the following sales executive performance data and provide a professional report.

Executive Name: ${data.name}
Total Calls: ${data.totalCalls}
Average Call Duration: ${data.avgDuration}s
Conversion Rate: ${data.conversionRate}%
Connected: ${data.connected}
Interested: ${data.interested}
Busy: ${data.busy}
Not Interested: ${data.notInterested}
No Answer: ${data.noAnswer}
Follow-Ups Scheduled: ${data.followUpsScheduled}
Follow-Ups Completed: ${data.followUpsCompleted}
Follow-Ups Missed: ${data.followUpsMissed}
Follow-Up Success Rate: ${data.followUpSuccessRate}%
Deals Closed: ${data.dealsClosed}
Deals Lost: ${data.dealsLost}
Stale Leads: ${data.staleLeads}
Trust Score: ${data.trustScore}

Response format:
Performance Summary:
[1-2 professional paragraphs]

Room for Improvement:
[2-4 bullet points with data-driven coaching advice]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    // Parse the response into summary and improvements
    const summaryMatch = content?.match(/Performance Summary:([\s\S]*?)Room for Improvement:/i);
    const improvementsMatch = content?.match(/Room for Improvement:([\s\S]*)/i);

    return NextResponse.json({
      summary: summaryMatch ? summaryMatch[1].trim() : (content || fallbackResponse.summary),
      improvements: improvementsMatch ? improvementsMatch[1].trim() : fallbackResponse.improvements,
    });
  } catch (error: any) {
    console.error('AI Analysis Error (using fallback):', error);
    // Return fallback instead of 500 when OpenAI fails (e.g. 429 quota)
    return NextResponse.json(fallbackResponse);
  }
}
