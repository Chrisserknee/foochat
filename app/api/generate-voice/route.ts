import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, advancedVoice = false } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'Voice generation not available' },
        { status: 503 }
      );
    }

    // Check if response is too long for voice
    const isResponseTooLongForVoice = message.length > 600;
    if (isResponseTooLongForVoice) {
      return NextResponse.json(
        { error: 'Message too long for voice generation (max 600 characters)' },
        { status: 400 }
      );
    }

    console.log('🎤 Generating voice on-demand for message:', {
      messageLength: message.length,
      advancedVoice
    });

    const voiceStartTime = Date.now();

    // Use Pablo Marshal - the authentic Mexican-sounding voice for Foo
    const voiceId = 'OhisAd2u8Q6qSA4xXAAT'; // Pablo Marshal (Mexican-sounding voice)

    const voiceResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: message,
          model_id: advancedVoice ? 'eleven_turbo_v2_5' : 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    );

    const voiceDuration = Date.now() - voiceStartTime;
    console.log(`⏱️ Voice generation took ${voiceDuration}ms`);

    if (!voiceResponse.ok) {
      const errorText = await voiceResponse.text();
      console.error('⚠️ ElevenLabs error status:', voiceResponse.status);
      console.error('⚠️ ElevenLabs error:', errorText);
      return NextResponse.json(
        { error: 'Voice generation failed' },
        { status: voiceResponse.status }
      );
    }

    const audioBuffer = await voiceResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    console.log('✅ Voice generated successfully on-demand');

    return NextResponse.json({
      audioUrl,
      duration: voiceDuration
    });

  } catch (error: any) {
    console.error('❌ Voice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice' },
      { status: 500 }
    );
  }
}

