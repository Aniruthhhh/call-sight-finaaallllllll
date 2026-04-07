require('dotenv').config();
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const { WaveFile } = require('wavefile');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 1. Socket.io for the Frontend UI
const io = new Server(server, {
  cors: { origin: '*' }
});

// 2. OpenAI initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
});

// 3. Raw WebSocket server for Twilio Media Streams
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Twilio Media Stream connected');
  
  let buffer = [];
  let chunkTimer = null;
  let callSid = 'unknown';

  const sendToWhisperAndBroadcast = async (audioPayloadBase64) => {
    if (!audioPayloadBase64 || audioPayloadBase64.length === 0) return;
    
    // Properly concatenate multiple base64 payloads
    const rawBuffer = Buffer.concat(audioPayloadBase64.map(b64 => Buffer.from(b64, 'base64')));
    
    if (rawBuffer.length < 8000) {
        // Too short (< 1 sec) to transcribe reliably. Stick the payloads back in the buffer!
        buffer.unshift(...audioPayloadBase64);
        return; 
    }

    // Convert to WAV
    let wav = new WaveFile();
    // 1 channel, 8000 Hz, 8-bit mu-law ('8m')
    wav.fromScratch(1, 8000, '8m', rawBuffer);
    
    const tmpFilePath = path.join('/tmp', `chunk-${Date.now()}.wav`);
    fs.writeFileSync(tmpFilePath, wav.toBuffer());

    try {
      // Send to OpenAI Whisper
      console.log('Sending chunk to OpenAI Whisper...');
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpFilePath),
        model: 'whisper-1',
        language: 'en'
      });

      console.log('Transcript chunk:', response.text);
      if (response.text.trim().length > 0) {
          // Emit to all connected React clients
          io.emit('transcript_update', {
              callSid,
              text: response.text,
              timestamp: Date.now()
          });
      }
    } catch (err) {
      console.error('Whisper Error:', err.message);
    } finally {
      // Clean up
      try { fs.unlinkSync(tmpFilePath); } catch (e) {}
    }
  };

  // Buffer chunks of roughly 4 seconds
  // 8000 bytes/sec roughly since it's 8000Hz * 1 byte (8-bit)
  const CHUNK_FLUSH_INTERVAL = 4000; 

  chunkTimer = setInterval(() => {
    if (buffer.length > 0) {
      const payloadToProcess = [...buffer];
      buffer = []; // reset buffer
      sendToWhisperAndBroadcast(payloadToProcess);
    }
  }, CHUNK_FLUSH_INTERVAL);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.event === 'start') {
        callSid = data.start.callSid;
        console.log(`Stream started for Call: ${callSid}`);
      } else if (data.event === 'media') {
        buffer.push(data.media.payload);
      } else if (data.event === 'stop') {
        console.log('Stream stopped');
        if (chunkTimer) clearInterval(chunkTimer);
        // Flush remaining
        if (buffer.length > 0) {
            sendToWhisperAndBroadcast([...buffer]);
            buffer = [];
        }
      }
    } catch (err) {
        // Just ignore parsing errors if any
    }
  });

  ws.on('close', () => {
    console.log('Twilio Media Stream disconnected');
    if (chunkTimer) clearInterval(chunkTimer);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Transcription Dual-Server running on port ${PORT}`);
  console.log(`- Twilio inbound WSS route: wss://<ngrok>/`);
  console.log(`- Frontend Socket.io API: http://localhost:${PORT}`);
});
