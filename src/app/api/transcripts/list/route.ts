import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'

import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }

    const transcriptsDir = path.join(process.cwd(), 'public', 'transcripts');
    
    if (!fs.existsSync(transcriptsDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(transcriptsDir);
    // Find files mapping to leadId
    const leadFiles = files
      .filter(file => file.startsWith(`${leadId}_`) && file.endsWith('.pdf'))
      .map(file => {
         const parts = file.replace('.pdf', '').split('_');
         const timestampStr = parts[parts.length - 1];
         const timestamp = parseInt(timestampStr, 10);
         
         return {
            filename: file,
            url: `/transcripts/${file}`,
            date: !isNaN(timestamp) ? new Date(timestamp).toLocaleString() : 'Unknown Date',
            timestamp: !isNaN(timestamp) ? timestamp : 0
         };
      })
      .sort((a, b) => b.timestamp - a.timestamp); // newest first

    return NextResponse.json({ files: leadFiles });
  } catch (error) {
    console.error('List Transcripts Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
