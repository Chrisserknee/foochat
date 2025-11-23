import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get optional limit parameter (default: 100 most recent messages)
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch chat messages for the user, ordered by most recent first
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch chat history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat history' },
        { status: 500 }
      );
    }

    // Reverse to get chronological order (oldest first)
    const sortedMessages = (messages || []).reverse().map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      imageUrl: msg.image_url || undefined,
      audioUrl: msg.audio_url || undefined,
      timestamp: new Date(msg.created_at)
    }));

    console.log(`✅ Fetched ${sortedMessages.length} messages for user ${userId}`);

    return NextResponse.json({ messages: sortedMessages });

  } catch (error: any) {
    console.error('❌ Chat history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

