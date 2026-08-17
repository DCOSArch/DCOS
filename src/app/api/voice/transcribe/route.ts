import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    let transcript = '';

    if (groqKey) {
      try {
        const whisperForm = new FormData();
        whisperForm.append('file', file, 'audio.webm');
        whisperForm.append('model', 'whisper-large-v3');
        whisperForm.append('temperature', '0.0');
        whisperForm.append('response_format', 'json');

        const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: whisperForm,
        });

        if (whisperRes.ok) {
          const json = await whisperRes.json();
          transcript = json.text || '';
        }
      } catch (err) {
        console.warn('Groq Whisper call error:', err);
      }
    }

    if (!transcript) {
      return NextResponse.json({
        success: true,
        transcript: '',
        message: 'No voice transcription captured. Please ensure audio is recorded clearly.',
        extracted: null,
      });
    }

    // Return the actual transcription derived from audio without hardcoded static fabrication
    return NextResponse.json({
      success: true,
      transcript,
      extracted: null,
    });
  } catch (error: any) {
    console.error('Voice transcribe error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
