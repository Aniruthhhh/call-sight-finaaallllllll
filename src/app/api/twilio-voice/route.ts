import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')

  const response = new twilio.twiml.VoiceResponse()
  
  if (phone) {
    response.say('Connecting you to your lead now.')
    
    // Initiate WebSocket Media Stream if configured
    if (process.env.NGROK_WSS_URL) {
      const start = response.start();
      start.stream({
        url: process.env.NGROK_WSS_URL
      });
    }

    response.dial(phone)
  } else {
    response.say('Error: No phone number provided.')
  }

  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}

// Twilio might also use GET for the initial voice URL depending on configuration
export async function GET(req: Request) {
  return POST(req)
}
