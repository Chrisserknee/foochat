import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 Transcription request received');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('📝 Transcribing audio:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Convert File to Buffer for OpenAI
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Determine file extension from type or name
    let extension = 'webm';
    if (audioFile.type.includes('mp4')) extension = 'mp4';
    else if (audioFile.type.includes('ogg')) extension = 'ogg';
    else if (audioFile.type.includes('wav')) extension = 'wav';
    else if (audioFile.name.includes('.')) {
      extension = audioFile.name.split('.').pop() || 'webm';
    }
    
    console.log('🔄 Converting audio:', {
      originalType: audioFile.type,
      extension: extension,
      size: audioBuffer.length
    });
    
    // Create a new File object for OpenAI with proper extension
    const audioForWhisper = new File([audioBuffer], `audio.${extension}`, { 
      type: audioFile.type || 'audio/webm'
    });

    // Transcribe with Whisper
    console.log('🎙️ Calling Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: audioForWhisper,
      model: 'whisper-1',
      language: 'en', // English
      response_format: 'text'
    });

    // Whisper returns string when response_format is 'text'
    const text = typeof transcription === 'string' ? transcription : transcription.text;
    
    console.log('✅ Transcription successful:', text);

    return NextResponse.json({ 
      text: text 
    });

  } catch (error: any) {
    console.error('❌ Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}

