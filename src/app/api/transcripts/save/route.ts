import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { leadId, leadName, phoneNumber, callSid, transcriptText } = await req.json();

    if (!leadId || !transcriptText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `${leadId}_${timestamp}.pdf`;
    
    // Save to public/transcripts
    const transcriptsDir = path.join(process.cwd(), 'public', 'transcripts');
    if (!fs.existsSync(transcriptsDir)) {
      fs.mkdirSync(transcriptsDir, { recursive: true });
    }
    const filePath = path.join(transcriptsDir, filename);

    // Create a new PDF Document
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Title Section
    doc.fontSize(24).font('Helvetica-Bold').text('Call Transcript', { align: 'center' });
    doc.moveDown(2);

    // Metadata Section
    doc.fontSize(12).font('Helvetica');
    doc.text(`Lead Name: ${leadName || 'Unknown'}`);
    doc.text(`Phone: ${phoneNumber || 'Unknown'}`);
    doc.text(`Date & Time: ${new Date().toLocaleString()}`);
    doc.text(`Call SID: ${callSid || 'Simulated'}`);
    
    doc.moveDown(2);
    
    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Transcript Content
    doc.fontSize(11).font('Helvetica');
    doc.text(transcriptText, {
      align: 'left',
      lineGap: 4
    });

    // Finalize PDF file
    doc.end();

    // Wait for file writing to finish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
    });

    const fileUrl = `/transcripts/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
